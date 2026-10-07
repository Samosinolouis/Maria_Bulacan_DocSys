import type { DefaultSession } from 'next-auth';

/**
 * NextAuth module augmentation.
 *
 * The NextAuth session carries only the OIDC access token (used as the Bearer
 * token on GraphQL calls) plus the Keycloak identity. The DocSys shadow user
 * (id, roles, effectivePermissions) is loaded separately through the backend
 * `me` query by the session service - it is not stored in the NextAuth session.
 */
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    /** Set when the token refresh failed; the client must re-authenticate. */
    error?: 'RefreshAccessTokenError';
    expiresAt?: number;
    /** Keycloak id_token, passed as `id_token_hint` on RP-initiated logout. */
    idToken?: string;
    user: DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    /** Absolute expiry (seconds since epoch) of the access token. */
    expiresAt?: number;
    /** Keycloak id_token (logout hint). */
    idToken?: string;
    error?: 'RefreshAccessTokenError';
  }
}

// In Auth.js v5 the JWT the callbacks receive is declared in `@auth/core/jwt`
// and merely re-exported by `next-auth/jwt`, so both must be augmented.
declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    /** Absolute expiry (seconds since epoch) of the access token. */
    expiresAt?: number;
    /** Keycloak id_token (logout hint). */
    idToken?: string;
    error?: 'RefreshAccessTokenError';
  }
}
