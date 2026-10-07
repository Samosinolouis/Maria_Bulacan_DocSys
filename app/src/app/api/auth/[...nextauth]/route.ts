import { handlers } from '@/auth';

/**
 * NextAuth route handlers - `/api/auth/*`.
 * `GET` serves sign-in/callback/session/csrf; `POST` serves the credentials and
 * callback submissions. This file is the reason the app runs a Next server.
 */
export const { GET, POST } = handlers;
