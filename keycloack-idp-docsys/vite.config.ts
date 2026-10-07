import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";
import { defineConfig } from "vite";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        keycloakify({
            accountThemeImplementation: "none",
            environmentVariables: [
                {
                  name: "SHADCN_THEME_LOGO_WHITE_URL",
                  default: "",
                },
                {
                  name: "SHADCN_THEME_LOGO_DARK_URL",
                  default: "",
                },
                { name: "SHADCN_THEME_APP_NAME", default: "DocSys" },
                { name: "SHADCN_THEME_LAYOUT", default: "two-column" },
                { name: "SHADCN_THEME_SIDE_IMAGE_URL", default: "" },
                { name: "SHADCN_THEME_PRESET", default: "green" },
                { name: "SHADCN_THEME_BASE", default: "slate" },
                { name: "SHADCN_THEME_RADIUS", default: "small" },
                { name: "SHADCN_THEME_FONT", default: "inter" },
                { name: "SHADCN_THEME_PLACEHOLDER", default: "true" },
              ],
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src")
        }
    }
});