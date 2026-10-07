#!/usr/bin/env bash
# Browserless end-to-end check of the DocSys Auth.js v5 + Keycloak login.
#
# Prereq: docker compose up -d (Keycloak on :8080), backend on :4000, and a
# running `next dev` in app/ with a valid app/.env.local (AUTH_SECRET set).
#
# Usage:  bash login-flow.sh [base-url] [username] [password]
#   defaults: http://localhost:3000  administrator  DocSys2026!
#
# Success looks like step 6 returning
#   {"user":{"name":"Elmer Clemente",...},"expires":"...","accessToken":"eyJ..."}
#
# GOTCHA: curl.exe is a native mingw build and does NOT understand MSYS paths.
# The cookie jar must be a native path (C:/... or D:/...) - passing /tmp/...
# silently writes no cookies and the signin step answers error=MissingCSRF.
set -u
BASE="${1:-http://localhost:3000}"
USERNAME="${2:-administrator}"
PASSWORD="${3:-DocSys2026!}"
# Windows sets LOCALAPPDATA with backslashes; curl needs forward slashes.
JAR="${JAR:-${LOCALAPPDATA//\\//}/Temp/docsys-auth-jar.txt}"
rm -f "$JAR"

fail() { echo "FAIL: $1"; exit 1; }

# 1. CSRF token (also seeds the csrf cookie)
CSRF=$(curl -s -c "$JAR" -b "$JAR" "$BASE/api/auth/csrf" | sed -n 's/.*"csrfToken":"\([^"]*\)".*/\1/p')
[ -n "$CSRF" ] || fail "no csrfToken from $BASE/api/auth/csrf (server up? AUTH_SECRET set?)"
echo "[1] csrfToken=${CSRF:0:16}..."

# 2. Ask NextAuth for the Keycloak authorize URL
SIGNIN=$(curl -s -c "$JAR" -b "$JAR" -X POST "$BASE/api/auth/signin/keycloak" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'X-Auth-Return-Redirect: 1' \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "callbackUrl=$BASE/" \
  --data "json=true")
AUTH_URL=$(echo "$SIGNIN" | sed -n 's/.*"url":"\([^"]*\)".*/\1/p' | sed 's/\\u0026/\&/g')
[ -n "$AUTH_URL" ] || fail "no authorize url: $SIGNIN"
echo "[2] authorize url ok ($(echo "$AUTH_URL" | cut -c1-60)...)"

# 3. Follow it to the Keycloak login form. The DocSys login theme is a
#    keycloakify SPA: the <form> is built client-side, so there is no
#    action="..." attribute in the server HTML. Read url.loginAction out of the
#    kcContext the FTL embeds instead.
LOGIN_HTML=$(curl -s -c "$JAR" -b "$JAR" -L "$AUTH_URL")
FORM_ACTION=$(printf '%s' "$LOGIN_HTML" \
  | sed -n 's/.*"loginAction": *"\([^"]*\)".*/\1/p' \
  | head -1 \
  | sed 's/\\\//\//g; s/\\u0026/\&/g')
case "$FORM_ACTION" in
  *login-actions/authenticate*) ;;
  *) fail "not the Keycloak login form (got '${FORM_ACTION:0:80}') - realm docsys up?" ;;
esac
echo "[3] keycloak login form ok"

# 4. Submit credentials
CALLBACK_URL=$(curl -s -c "$JAR" -b "$JAR" -o /dev/null -w '%{redirect_url}' -X POST "$FORM_ACTION" \
  --data-urlencode "username=$USERNAME" \
  --data-urlencode "password=$PASSWORD" \
  --data "credentialId=")
case "$CALLBACK_URL" in
  *api/auth/callback/keycloak*) ;;
  *) fail "Keycloak rejected '$USERNAME' or did not redirect back (got '${CALLBACK_URL:0:100}')" ;;
esac
echo "[4] credentials accepted"

# 5. Hit the NextAuth callback (sets authjs.session-token)
curl -s -c "$JAR" -b "$JAR" -D - -o /dev/null "$CALLBACK_URL" \
  | grep -iE '^(HTTP/|location|set-cookie: authjs.session)' | head -4
echo "[5] callback done"

# 6. Read the session the client would see
SESSION=$(curl -s -c "$JAR" -b "$JAR" "$BASE/api/auth/session")
echo "[6] $SESSION"
case "$SESSION" in
  *accessToken*) echo "PASS" ;;
  *) fail "session has no accessToken" ;;
esac
