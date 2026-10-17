/**
 * This file has been claimed for ownership from @oussemasahbeni/keycloakify-login-shadcn version 250004.0.24.
 * To relinquish ownership and restore this file to its original content, run the following command:
 * 
 * $ npx keycloakify own --path "login/components/Template/layouts/TwoColumnLayout.tsx" --revert
 */

import type { ReactNode } from "react";
import { GovMasthead, GovFooter, InstitutionalPanel } from "../../DocsysChrome";

export function TwoColumnLayout(props: { content: ReactNode; logoUrl: string }) {
    const { content } = props;

    return (
        <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col justify-between selection:bg-[#15803D] selection:text-white">
            <GovMasthead />

            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col md:flex-row">
                    <InstitutionalPanel />
                    <div className="w-full md:w-7/12 p-6 sm:p-8 bg-white flex flex-col justify-center">
                        {content}
                    </div>
                </div>
            </main>

            <GovFooter />
        </div>
    );
}
