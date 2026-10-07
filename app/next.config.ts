import type { NextConfig } from "next";

// NOTE: `output: 'export'` was removed so the app can run the NextAuth route
// handlers under `/api/auth/*` (the Keycloak OIDC authorization-code flow is
// server-side). The app still deploys as a normal Next server; bind it to
// localhost in development if it must not be reachable from the network.
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
