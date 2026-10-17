/**
 * This file has been claimed for ownership from @oussemasahbeni/keycloakify-login-shadcn version 250004.0.24.
 * To relinquish ownership and restore this file to its original content, run the following command:
 * 
 * $ npx keycloakify own --path "login/components/Template/TemplateContent.tsx" --revert
 */

import { cn } from "@/components/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { kcSanitize } from "@keycloakify/login-ui/kcSanitize";
import { useKcClsx } from "@keycloakify/login-ui/useKcClsx";
import { RotateCcw, User } from "lucide-react";
import { type ReactNode } from "react";
import { useI18n } from "../../i18n";
import { useKcContext } from "../../KcContext";
import type { TemplateProps } from "./Template";

type TemplateContentProps = TemplateProps & {
    logoWhiteUrl: string;
    logoDarkUrl: string;
    cardClassName?: string;
    brandingVisibilityClassName?: string;
};

export function TemplateContent(props: TemplateContentProps) {
    const {
        displayInfo = false,
        displayMessage = true,
        displayRequiredFields = false,
        headerNode,
        socialProvidersNode = null,
        infoNode = null,
        children,
        logoWhiteUrl,
        logoDarkUrl,
        cardClassName,
        brandingVisibilityClassName
    } = props;

    const { kcContext } = useKcContext();
    const { auth, url, message, isAppInitiatedAction, realm } = kcContext;
    const { msg, msgStr } = useI18n();
    const { kcClsx } = useKcClsx();

    const titleNode: ReactNode = !(
        auth !== undefined &&
        auth.showUsername &&
        !auth.showResetCredentials
    ) ? (
        <div className="border-b border-[#E2E8F0] pb-4 mb-4">
            <span className="font-mono text-[10px] font-bold text-[#15803D] uppercase tracking-wider block">
                Official Identity Provider (SSO)
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#081E36] tracking-tight mt-1">
                {headerNode}
            </h2>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed font-normal">
                Municipal single sign-on access to the Santa Maria Document System statutory docket.
            </p>
        </div>
    ) : (
        <div id="kc-username" className="flex items-center justify-between gap-2 p-3 bg-[#F8FAFC] rounded border border-[#CBD5E1] mb-4">
            <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-[#15803D]/10 text-[#15803D] flex items-center justify-center">
                    <User className="size-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">
                        {msgStr("attemptedUsernameLoggingInAs")}
                    </span>
                    <span className="font-semibold text-sm text-[#081E36]" id="kc-attempted-username">
                        {auth.attemptedUsername}
                    </span>
                </div>
            </div>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" asChild>
                            <a
                                id="reset-login"
                                href={url.loginRestartFlowUrl}
                                aria-label={msgStr("restartLoginTooltip")}
                            >
                                <RotateCcw className="size-4" />
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{msg("restartLoginTooltip")}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );

    return (
        <Card className={cn("border-0 shadow-none bg-transparent", cardClassName)}>
            <CardHeader className="p-0 pb-2">
                <div
                    className={cn(
                        "flex flex-col items-center justify-center gap-3",
                        brandingVisibilityClassName
                    )}
                >
                    <div className="flex items-center gap-3 mb-4 ">
                        <img src={logoWhiteUrl} className="size-14 dark:hidden" />
                        <img
                            src={logoDarkUrl}
                            className="size-14 hidden dark:inline-block"
                        />
                        {realm.displayNameHtml ? (
                            <span
                                className="text-xl"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(realm.displayNameHtml)
                                }}
                            />
                        ) : (
                            <span className="text-xl">
                                {realm.displayName || realm.name}
                            </span>
                        )}
                    </div>
                </div>

                <CardTitle className="font-normal">
                    {displayRequiredFields ? (
                        <div className="flex items-center justify-between gap-2">
                            <div>{titleNode}</div>
                            <div>
                                <span className="subtitle text-[11px] text-[#64748B]">
                                    <span className="text-red-500" aria-hidden="true">
                                        *
                                    </span>
                                    {msg("requiredFields")}
                                </span>
                            </div>
                        </div>
                    ) : (
                        titleNode
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-0 pt-2">
                <div id="kc-content" className="flex flex-col gap-4">
                    {displayMessage &&
                        message !== undefined &&
                        (message.type !== "warning" || !isAppInitiatedAction) && (
                            <Alert variant={message.type}>
                                <AlertDescription>
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: kcSanitize(message.summary)
                                        }}
                                    />
                                </AlertDescription>
                            </Alert>
                        )}

                    {socialProvidersNode}
                    {children}

                    {auth !== undefined && auth.showTryAnotherWayLink && (
                        <form
                            id="kc-select-try-another-way-form"
                            action={url.loginAction}
                            method="post"
                        >
                            <div className={kcClsx("kcFormGroupClass")}>
                                <input type="hidden" name="tryAnotherWay" value="on" />
                                <Button
                                    type="button"
                                    className="w-full"
                                    variant="outline"
                                    asChild
                                >
                                    <a
                                        href="#"
                                        id="try-another-way"
                                        onClick={event => {
                                            document.forms[
                                                "kc-select-try-another-way-form" as never
                                            ].submit();
                                            event.preventDefault();
                                            return false;
                                        }}
                                    >
                                        {msg("doTryAnotherWay")}
                                    </a>
                                </Button>
                            </div>
                        </form>
                    )}

                    {displayInfo && <div className="text-center text-sm">{infoNode}</div>}
                </div>
            </CardContent>
        </Card>
    );
}
