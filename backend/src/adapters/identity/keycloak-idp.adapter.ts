/**
 * Keycloak Identity Provider Adapter
 *
 * Implements IIdentityProviderPort: verifies OIDC tokens against Keycloak's
 * JWKS endpoint and manages user accounts via the Keycloak Admin REST API.
 *
 * [SOLID:SRP]  Token verification + account/role management only.
 * [SOLID:DIP]  Business layer imports IIdentityProviderPort, not this class.
 * [OWASP:A07]  Validates algorithm, issuer, and signature (RS256).
 * [OWASP:A02]  Uses the server-side Admin API — no client-side crypto.
 * [NFR-05]     No passwords are ever stored in the application database.
 */

import jwt, { type JwtHeader, type JwtPayload, type SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

import { config } from "../../config/index.js";
import {
  AuthenticationError,
  AppError,
  CommonErrorCode,
} from "../../errors/index.js";
import type {
  IIdentityProviderPort,
  AuthUser,
  IdpUser,
  CreateIdpUserInput,
  UpdateIdpUserInput,
  IdpOperationResult,
} from "../../ports/idp.port.interface.js";

export class KeycloakIdpAdapter implements IIdentityProviderPort {
  private readonly client: jwksClient.JwksClient;
  private readonly realmUrl: string;
  private readonly adminBaseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.client = jwksClient({
      jwksUri: config.keycloak.jwksUri,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
    this.realmUrl = config.keycloak.realmUrl;
    this.clientId = config.keycloak.clientId;
    this.clientSecret = config.keycloak.clientSecret;

    // Derive the admin base URL: /realms/<realm> -> /admin/realms/<realm>
    const url = new URL(this.realmUrl);
    this.adminBaseUrl = `${url.origin}${url.pathname.replace(
      /^\/realms\//,
      "/admin/realms/",
    )}`;
  }

  // ============================================
  // Authentication (FR-01)
  // ============================================

  private getKey(header: JwtHeader, callback: SigningKeyCallback): void {
    this.client.getSigningKey(header.kid, (err, key) => {
      if (err || !key) {
        return callback(err ?? new Error("Signing key not found"));
      }
      callback(null, key.getPublicKey());
    });
  }

  async verifyToken(token: string): Promise<AuthUser> {
    return new Promise<AuthUser>((resolve, reject) => {
      jwt.verify(
        token,
        (header, cb) => this.getKey(header, cb),
        { algorithms: ["RS256"], issuer: this.realmUrl },
        (err, decoded) => {
          if (err) {
            return reject(
              new AuthenticationError(
                err.name === "TokenExpiredError"
                  ? "Token has expired"
                  : "Invalid token",
              ),
            );
          }

          const payload = decoded as JwtPayload & {
            realm_access?: { roles?: string[] };
          };

          resolve({
            sub: payload.sub!,
            email: payload.email,
            preferredUsername: payload.preferred_username,
            name: payload.name,
            roles: payload.realm_access?.roles ?? [],
          });
        },
      );
    });
  }

  // ============================================
  // Admin API plumbing
  // ============================================

  /** Obtain a service-account token via client_credentials grant. */
  private async getAdminToken(): Promise<string> {
    const tokenUrl = `${this.realmUrl}/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new AppError("Failed to connect to identity provider", {
        status: 502,
        code: CommonErrorCode.INTERNAL_ERROR,
      });
    }

    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  /** JSON admin request helper. Returns raw Response for status handling. */
  private async adminFetch(
    path: string,
    init: { method: string; body?: unknown } = { method: "GET" },
  ): Promise<Response> {
    const token = await this.getAdminToken();
    return fetch(`${this.adminBaseUrl}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(init.body !== undefined && { body: JSON.stringify(init.body) }),
    });
  }

  private mapIdpUser(raw: Record<string, unknown>): IdpUser {
    const attr = (raw.attributes as Record<string, string[]> | undefined) ?? {};
    return {
      id: String(raw.id),
      email: String(raw.email ?? ""),
      emailVerified: Boolean(raw.emailVerified),
      username: raw.username ? String(raw.username) : undefined,
      firstName: raw.firstName ? String(raw.firstName) : undefined,
      lastName: raw.lastName ? String(raw.lastName) : undefined,
      fullName:
        [raw.firstName, raw.lastName].filter(Boolean).join(" ") || undefined,
      phoneNumber: attr.phoneNumber?.[0],
      phoneNumberVerified: Boolean(attr.phoneNumber),
      enabled: Boolean(raw.enabled),
      createdAt: raw.createdTimestamp
        ? new Date(Number(raw.createdTimestamp))
        : undefined,
    };
  }

  // ============================================
  // User account management (FR-02..FR-06)
  // ============================================

  async createUser(
    input: CreateIdpUserInput,
  ): Promise<IdpOperationResult & { userId?: string }> {
    try {
      const res = await this.adminFetch("/users", {
        method: "POST",
        body: {
          username: input.username ?? input.email,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          enabled: true,
          emailVerified: false,
          ...(input.phoneNumber && {
            attributes: { phoneNumber: [input.phoneNumber] },
          }),
          ...(input.password && {
            credentials: [
              { type: "password", value: input.password, temporary: true },
            ],
          }),
        },
      });

      if (!res.ok) {
        return { success: false, error: await res.text(), errorCode: "CREATE_FAILED" };
      }

      const location = res.headers.get("location"); // .../users/<id>
      const userId = location?.split("/").pop();
      return { success: true, userId };
    } catch (error) {
      return { success: false, error: (error as Error).message, errorCode: "IDP_ERROR" };
    }
  }

  async updateUser(
    userId: string,
    input: UpdateIdpUserInput,
  ): Promise<IdpOperationResult> {
    try {
      const res = await this.adminFetch(`/users/${userId}`, {
        method: "PUT",
        body: {
          ...(input.email !== undefined && { email: input.email }),
          ...(input.firstName !== undefined && { firstName: input.firstName }),
          ...(input.lastName !== undefined && { lastName: input.lastName }),
          ...(input.username !== undefined && { username: input.username }),
          ...(input.phoneNumber !== undefined && {
            attributes: { phoneNumber: input.phoneNumber ? [input.phoneNumber] : [] },
          }),
        },
      });
      return { success: res.ok, ...(res.ok ? {} : { error: await res.text() }) };
    } catch (error) {
      return { success: false, error: (error as Error).message, errorCode: "IDP_ERROR" };
    }
  }

  async getUser(userId: string): Promise<IdpUser | null> {
    const res = await this.adminFetch(`/users/${userId}`);
    if (!res.ok) return null;
    return this.mapIdpUser((await res.json()) as Record<string, unknown>);
  }

  async getUserByEmail(email: string): Promise<IdpUser | null> {
    const res = await this.adminFetch(
      `/users?email=${encodeURIComponent(email)}&exact=true`,
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return rows.length > 0 ? this.mapIdpUser(rows[0]) : null;
  }

  async enableUser(userId: string): Promise<IdpOperationResult> {
    return this.setEnabled(userId, true);
  }

  async disableUser(userId: string): Promise<IdpOperationResult> {
    return this.setEnabled(userId, false);
  }

  private async setEnabled(
    userId: string,
    enabled: boolean,
  ): Promise<IdpOperationResult> {
    try {
      const res = await this.adminFetch(`/users/${userId}`, {
        method: "PUT",
        body: { enabled },
      });
      return { success: res.ok };
    } catch (error) {
      return { success: false, error: (error as Error).message, errorCode: "IDP_ERROR" };
    }
  }

  // ============================================
  // Role management (FR-04)
  // ============================================

  async addRole(userId: string, role: string): Promise<IdpOperationResult> {
    try {
      const roleRes = await this.adminFetch(`/roles/${encodeURIComponent(role)}`);
      if (!roleRes.ok) return { success: false, error: "Role not found", errorCode: "ROLE_NOT_FOUND" };
      const roleRep = (await roleRes.json()) as Record<string, unknown>;

      const res = await this.adminFetch(`/users/${userId}/role-mappings/realm`, {
        method: "POST",
        body: [roleRep],
      });
      return { success: res.ok };
    } catch (error) {
      return { success: false, error: (error as Error).message, errorCode: "IDP_ERROR" };
    }
  }

  async removeRole(userId: string, role: string): Promise<IdpOperationResult> {
    try {
      const roleRes = await this.adminFetch(`/roles/${encodeURIComponent(role)}`);
      if (!roleRes.ok) return { success: false, error: "Role not found", errorCode: "ROLE_NOT_FOUND" };
      const roleRep = (await roleRes.json()) as Record<string, unknown>;

      const res = await this.adminFetch(`/users/${userId}/role-mappings/realm`, {
        method: "DELETE",
        body: [roleRep],
      });
      return { success: res.ok };
    } catch (error) {
      return { success: false, error: (error as Error).message, errorCode: "IDP_ERROR" };
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const res = await this.adminFetch(`/users/${userId}/role-mappings/realm`);
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return rows.map((r) => String(r.name));
  }

  // ============================================
  // Credential flows
  // ============================================

  async sendPasswordResetEmail(email: string): Promise<IdpOperationResult> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) return { success: false, error: "User not found", errorCode: "NOT_FOUND" };

      const res = await this.adminFetch(
        `/users/${user.id}/execute-actions-email`,
        { method: "PUT", body: ["UPDATE_PASSWORD"] },
      );
      return { success: res.ok };
    } catch (error) {
      return { success: false, error: (error as Error).message, errorCode: "IDP_ERROR" };
    }
  }
}
