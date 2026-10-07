/**
 * This file has been claimed for ownership from @oussemasahbeni/keycloakify-login-shadcn version 250004.0.24.
 * To relinquish ownership and restore this file to its original content, run the following command:
 * 
 * $ npx keycloakify own --path "login/styleLevelCustomization.tsx" --revert
 */

import { ThemeProvider } from "@/components/ThemeProvider";
import type { ClassKey } from "@keycloakify/login-ui/useKcClsx";
import type { ReactNode } from "react";
import "./index.css";
import { useKcContext } from "./KcContext";
import { getTheme } from "./shared/getColorScheme";

type Classes = { [key in ClassKey]?: string };

type StyleLevelCustomization = {
    doUseDefaultCss: boolean;
    classes?: Classes;
    loadCustomStylesheet?: () => void;
    Provider?: (props: { children: ReactNode }) => ReactNode;
};

// eslint-disable-next-line react-refresh/only-export-components
function Provider(props: { children: ReactNode }) {
    const { children } = props;

    const { kcContext } = useKcContext();

    return (
        <ThemeProvider defaultTheme={getTheme(kcContext.darkMode)}>
            {children}
        </ThemeProvider>
    );
}

export function useStyleLevelCustomization(): StyleLevelCustomization {
    return {
        doUseDefaultCss: false,
        Provider
    };
}
