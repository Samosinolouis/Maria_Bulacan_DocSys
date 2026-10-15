# DocSys Keycloak login theme (`keycloack-idp-docsys`)

> **Scope:** the keycloakify project that renders every Keycloak-hosted page for the `docsys` realm.
> **Audience:** engineers running the local stack, or restyling the sign-in desk.

Keycloak does not use the application's React code for sign-in. The browser leaves the app, lands on a page served by Keycloak, and comes back through the OIDC callback. This project supplies that page: keycloakify 11 + React 19 + Vite, built into a theme jar that Keycloak loads as the realm's `loginTheme`.

```
app (localhost:3000)                keycloak (localhost:8080)
  /login  --- redirect --->  /realms/docsys/protocol/openid-connect/auth
                                    |
                                    +-- renders login.ftl from the theme jar
                                        (dist_keycloak/ mounted at /opt/keycloak/providers)
                                    |
  /api/auth/callback/keycloak <--- redirect with the authorization code
```

## Current state (read this before rebuilding)

**The DocSys design is not in the committed source. It exists only in the built jar that is deployed right now.**

- All twelve owned files under `src/login/` are byte-identical to the vendored shadcn originals (only the ownership header differs), and no commit has ever contained the DocSys copy.
- `src/login/components/DocsysChrome.tsx` (GovMasthead, GovFooter, InstitutionalPanel) IS committed, but nothing imports it.
- The running container still serves the designed page because `dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar` was built on 2026-10-08 while the design was still uncommitted in the working tree; the tree was restored to the committed (stock) content about an hour later.

So `npm run build-keycloak-theme:docsys` from this checkout produces the **stock shadcn** sign-in page, not the institutional DocSys desk. Restore the design first, or the rebuild silently replaces the login page.

Material available to restore it:

| Source | What it gives you |
| ------ | ----------------- |
| `src/login/components/DocsysChrome.tsx` | The chrome components, palette and markup (already written, just unwired) |
| The deployed jar: `theme/keycloack-idp-docsys/login/messages/messages_en.properties` | The i18n override (`loginAccountTitle=Personnel Authentication Desk`) |
| The deployed jar: `theme/keycloack-idp-docsys/login/resources/dist/assets/Template-*.js` | The compiled JSX and Tailwind classes of the designed desk |
| The live page at http://localhost:8080 while the stack runs | The rendered copy and layout, verbatim |
| `app/src/app/login/page.tsx` | The application-side sign-in desk the theme mirrors |

## Prerequisites

| Requirement | Why |
| ----------- | --- |
| Node.js 22+ and npm | Vite build and the keycloakify CLI |
| Java 21 (Temurin) | `keycloakify build` compiles the theme jar through Maven |
| Apache Maven 3.9+ on `PATH` | `keycloakify build` shells out to `mvn -B -ntp clean install` and exits `Apache Maven required.` when `mvn --version` does not answer. Java alone is not enough |

Install with dev dependencies: this repo's shell exports `NODE_ENV=production` and npm is configured with `omit=dev`, which prunes `typescript`, `vite` and `storybook`.

```bash
cd keycloack-idp-docsys
npm install --include=dev      # postinstall runs `keycloakify sync-extensions`
```

`sync-extensions` re-syncs the vendored shadcn files into `src/`; files you have claimed with `keycloakify own` are left alone (verified: a marker appended to an owned file survives the command).

Windows notes for Maven:

- Put the Maven `bin` directory on `PATH` (a user-scope zip install is fine; no package manager needed).
- Use `mvn.cmd`, not the bundled `bin/mvn` shell script. The script computes a POSIX `MAVEN_HOME` that native `java` cannot resolve, so the build dies with `ClassNotFoundException: org.codehaus.plexus.classworlds.launcher.Launcher`.

## Preview without Keycloak

Both previews read the layout, preset and font defaults from `src/kc.gen.tsx` (`kcEnvDefaults`), so they render what production renders.

```bash
npm run storybook     # http://localhost:6006, story login/login.ftl -> Default
npm run dev           # Vite dev server, renders the login page from the mock kcContext
```

The Storybook story id is `<title-slug>--<story-slug>`: `login-login-ftl--default` for the plain sign-in page, plus variants such as `login-login-ftl--with-error-message`. Storybook picks up edits live, so the restyle loop is: edit a file, then read the iframe DOM at

```
http://localhost:6006/iframe.html?id=login-login-ftl--default&viewMode=story
```

## Build and deploy

```bash
docker compose stop keycloak                       # from the repo root
cd keycloack-idp-docsys
npm run build-keycloak-theme:docsys                # writes dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar
cd ..
docker compose up -d keycloak                      # recreates the container with dist_keycloak/ mounted
```

Three things about this recipe are deliberate:

1. **Stop Keycloak first.** While the container runs it holds the mounted jar open, and on Windows the rename into `dist_keycloak/` fails with `EPERM` - after Maven has already succeeded, so the failure looks like a build problem and is not.
2. **`build-keycloak-theme:docsys`, not `build-keycloak-theme`.** The plain script also emits `keycloak-theme-for-kc-22-to-25.jar`; the `:docsys` wrapper deletes it. That sibling targets Keycloak 22-25 and shades a `LoginFormsProviderFactory` SPI compiled against those versions, so it must not sit in a Keycloak 26 providers directory.
3. **The whole `dist_keycloak/` directory is bind-mounted, never the single jar.** Docker creates a *directory* at a bind-mount source that does not exist yet, which on a fresh clone lands exactly on the path `keycloakify build` must write, and the next build fails.

The first (cold) build can also die inside Maven with `PluginDescriptorParsingException ... maven-jar-plugin-3.5.0.jar: zip file is empty` or `Non-readable POM ... apache-37.pom: no more data available`. That is a race, not a network or path problem: keycloakify fires both Maven runs through `Promise.all` against one shared local repository, so on a cold repo the two processes download the same artifacts concurrently. Re-running the build succeeds, because the repository is then warm.

## Point the realm at the theme

A fresh import gets it from `infra/keycloak/docsys-realm.json`, which sets `"loginTheme": "keycloack-idp-docsys"`. `--import-realm` skips a realm that already exists, so an existing realm needs the admin API:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d client_id=admin-cli -d username=admin -d password=admin -d grant_type=password \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -s -X PUT http://localhost:8080/admin/realms/docsys \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"loginTheme":"keycloack-idp-docsys"}'
```

The theme name is the project's `package.json` `name` (`keycloack-idp-docsys`, the typo included). It is what `loginTheme` must equal and what the resources are served under.

## Verify it is live

Fetch the authorization endpoint and look for the theme's resources. A stock Keycloak page references nothing under `login/keycloack-idp-docsys/`:

```bash
curl -s "http://localhost:8080/realms/docsys/protocol/openid-connect/auth?client_id=docsys-app\
&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fkeycloak\
&response_type=code&scope=openid&state=probe&nonce=probe\
&code_challenge=abcabcabcabcabcabcabcabcabcabcabcabcabcabc0&code_challenge_method=S256" \
  | grep -o '/resources/[^"]*login/keycloack-idp-docsys[^"]*'
```

Expected: `/resources/<cache-token>/login/keycloack-idp-docsys/dist/assets/index-<hash>.js`. Fetch that path and it answers `200`. The `<cache-token>` changes whenever the theme changes, which is also the quickest way to see whether a rebuild actually landed.

The same check through the app, with no browser: `bash scripts/login-flow.sh` (repo root) drives the whole flow with curl and prints the resulting session. It scrapes `url.loginAction` out of the page's `kcContext`, which is how the keycloakify theme publishes its form target.

## Using it from the app

1. Open http://localhost:3000. The app requires authentication, so `/login` hands the browser straight to Keycloak - there is no sign-in form in the app and no button to press.
2. Keycloak renders the themed page; sign in with a realm account (`administrator` / `clerk`, password `DocSys2026!` from `backend/scripts/dev-seed.ts`).
3. Keycloak redirects back to `/api/auth/callback/keycloak`; NextAuth exchanges the code, the session service loads `me`, and the dashboard renders.

Signing out ends both sessions: the app clears its Auth.js cookie and then navigates to Keycloak's end-session endpoint, otherwise the realm's SSO cookie answers the next authorization request silently and the user is signed back in without a prompt. That return target lives on the client as the attribute `post.logout.redirect.uris` (`infra/keycloak/docsys-realm.json`).

The page is a single-page app: the server HTML carries no `<form>` and no `action` attribute. The form is built client-side and posts to the `login-actions/authenticate` URL embedded in the page's `kcContext`. Anything that drives the page by scraping HTML must read `url.loginAction` out of that JSON, not an `action` attribute.

The theme is light-only by design: `src/login/styleLevelCustomization.tsx` pins `ThemeProvider defaultTheme="light"` and the top bar carries no colour-scheme toggle, because the application has no dark palette.

## Editing the theme

Two kinds of file live under `src/login/`:

| Kind | How to tell | Consequence |
| ---- | ----------- | ----------- |
| **Owned** | Listed in the `=== Owned files start ===` block of `src/.gitignore`, and the file starts with a "claimed for ownership" header | Tracked and committable; safe to edit |
| **Vendored** | Every other file copied from `@oussemasahbeni/keycloakify-login-shadcn`; listed in that package's section of the same `.gitignore` | Ignored by git, so edits are neither committed nor restored by `sync-extensions` |

To change a vendored file, claim it first - the ownership marker is what moves it into the owned block, and until then a theme commit rebuilds as stock:

```bash
npx keycloakify own --path "login/pages/login/Form.tsx"           # SVG/XML files take -t instead
npx keycloakify own --path "login/pages/login/Form.tsx" --revert  # give it back
```

The DocSys design lived in exactly these twelve owned files: `login/i18n.ts`, `login/index.css`, `login/styleLevelCustomization.tsx`, `login/mocks/getKcContextMock.ts`, `login/components/Template/{Template,TemplateContent,TemplateTopBar}.tsx`, `login/components/Template/layouts/TwoColumnLayout.tsx`, `login/pages/info/index.ts`, `login/pages/login/{Form,Page,Page.stories}.tsx`.

Layout, palette preset, radius and font come from the `SHADCN_THEME_*` environment defaults in `vite.config.ts` (DocSys: `two-column`, `green`, `small`, `inter`). `src/kc.gen.tsx` holds `kcEnvDefaults`, which is what the previews read, so after changing those defaults run:

```bash
npx keycloakify update-kc-gen
```

Commit theme edits as soon as they render: these are tracked files, and the design above was lost precisely because it was uncommitted when the working tree was restored.

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Build fails at the very end with `EPERM ... rename` | The running Keycloak container holds the mounted jar open | `docker compose stop keycloak`, rebuild, `docker compose up -d keycloak` |
| `Apache Maven required.` | `mvn` is not on `PATH` | Add the Maven `bin` directory to `PATH` (Java alone is not enough) |
| `ClassNotFoundException: ...plexus.classworlds.launcher.Launcher` | The bundled `bin/mvn` shell script plus native `java` on Windows | Run `mvn.cmd`, or `cmd.exe /c "mvn ..."` |
| `PluginDescriptorParsingException` / `Non-readable POM` on a cold build | Two Maven runs share one local repository | Re-run the build; the repository is warm by then |
| Login page still looks stock | No jar built, or `loginTheme` not set on the realm | Build and deploy, set `loginTheme`, then re-check the resource URL |
| A rebuild produced a stock page | The design is not in the source (see "Current state") | Restore the design before rebuilding |
| Theme changes do not appear | The container was not recreated, or the browser cached the old cache-token | `docker compose up -d --force-recreate keycloak`, then hard-reload |

## Command reference

| Command | Description |
| ------- | ----------- |
| `npm install --include=dev` | Install; postinstall syncs the vendored extension files |
| `npm run storybook` | Preview the pages without Keycloak (port 6006) |
| `npm run dev` | Vite dev server rendering the login page from the mock `kcContext` |
| `npm run build` | Type-check + Vite build into `dist/` (no jar) |
| `npm run build-keycloak-theme:docsys` | Full theme build; leaves only the Keycloak 26 artifact |
| `npx keycloakify own --path "<file>"` | Claim a vendored file so edits become committable |
| `npx keycloakify update-kc-gen` | Regenerate `src/kc.gen.tsx` after changing the env defaults |
| `npm run lint` | ESLint |
