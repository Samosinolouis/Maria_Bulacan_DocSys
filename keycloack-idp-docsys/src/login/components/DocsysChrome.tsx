/**
 * DocSys institutional chrome for the Keycloak login theme.
 *
 * Mirrors the chrome of the Maria Bulacan DocSys application
 * (`app/src/components/GovMasthead.tsx`, `GovFooter.tsx` and the sign-in desk
 * in `app/src/app/login/page.tsx`) so the identity-provider pages are visually
 * indistinguishable from the application that redirects to them.
 *
 * Palette: Bulacan Navy #081E36 / #0B2545, civic green #15803D, gold #FCD116.
 */

import { ShieldCheck } from "lucide-react";
import bagongPilipinasLogo from "../assets/img/bagong-pilipinas-logo.webp";
import santaMariaSeal from "../assets/img/santa-maria-seal.png";

/** Thin government identification strip above the page content. */
export function GovMasthead() {
    return (
        <div className="bg-[#07192D] border-b border-[#FCD116]/25 text-[#E2E8F0] text-[11px] px-4 sm:px-6 py-1 flex items-center justify-between gap-3 overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="font-bold tracking-wider text-[#FCD116] shrink-0">GOVPH</span>
                <span className="text-[#94A3B8] shrink-0">|</span>
                <span className="text-[10px] sm:text-xs truncate">
                    Republika ng Pilipinas - Pamahalaang Bayan ng Santa Maria, Lalawigan ng Bulacan
                </span>
            </div>
            <div className="hidden md:flex items-center gap-4 text-[#94A3B8] shrink-0">
                <span>Philippine Standard Time (PST): RA 10535</span>
                <span className="text-[#FCD116] font-mono font-semibold">GMT+8</span>
            </div>
        </div>
    );
}

/** Statutory compliance footer, matching the application shell. */
export function GovFooter() {
    return (
        <footer className="bg-[#081E36] text-[#CBD5E1] border-t-2 border-[#15803D] mt-auto">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-white tracking-wide">
                            REPUBLIC OF THE PHILIPPINES
                        </h4>
                        <p className="text-[#94A3B8] leading-relaxed">
                            All content is in the public domain unless otherwise stated. Adheres to
                            the Philippine Government Web Standards (GWTS v25.3.3).
                        </p>
                        <div className="font-mono text-[11px] text-[#FCD116]">
                            ISO 9001:2015 Quality Management
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-bold text-white tracking-wide uppercase text-[11px]">
                            Municipal Government
                        </h4>
                        <ul className="space-y-1 text-[#94A3B8]">
                            <li>Pamahalaang Bayan ng Santa Maria, Bulacan</li>
                            <li>Tanggapan ng Administrador ng Bayan</li>
                            <li>Poblacion, Santa Maria, Bulacan 3022</li>
                            <li>Hotline: (044) 815-2882 | 8888 Citizen Complaint</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-bold text-white tracking-wide uppercase text-[11px]">
                            Statutory Compliance
                        </h4>
                        <ul className="space-y-1 text-[#94A3B8]">
                            <li>Republic Act 11032 (Ease of Doing Business)</li>
                            <li>Republic Act 10173 (Data Privacy Act of 2012)</li>
                            <li>Republic Act 8491 (Heraldic Code of the Philippines)</li>
                            <li>Republic Act 10535 (Philippine Standard Time)</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-bold text-white tracking-wide uppercase text-[11px]">
                            Executive Systems
                        </h4>
                        <ul className="space-y-1 text-[#94A3B8]">
                            <li>Anti-Red Tape Authority (ARTA) Electronic Docket</li>
                            <li>Executive Order and Legislative Indorsement Portal</li>
                            <li>Central Municipal Gavel and Venue Scheduler</li>
                            <li>National Government Portal (gov.ph)</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
                    <p>
                        (c) Pamahalaang Bayan ng Santa Maria, Bulacan - Tanggapan ng Administrador
                        ng Bayan. Lahat ng karapatan ay nakalaan.
                    </p>
                    <div className="flex items-center gap-4">
                        <span>Privacy Statement</span>
                        <span>Citizen Charter</span>
                        <span>Accessibility</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

/**
 * Left-hand institutional column: heraldry, the statutory security mandate and
 * the identity-provider custody chain, exactly as the DocSys sign-in desk.
 */
export function InstitutionalPanel() {
    return (
        <div className="w-full md:w-5/12 bg-[#081E36] text-white p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#0B2545]">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <img
                        src={santaMariaSeal}
                        alt="Official Seal of Santa Maria, Bulacan"
                        width={64}
                        height={64}
                        className="w-16 h-16 shrink-0 object-contain"
                    />
                    <div className="h-12 w-px bg-white/20" />
                    <img
                        src={bagongPilipinasLogo}
                        alt="Bagong Pilipinas Official Insignia"
                        width={56}
                        height={56}
                        className="w-14 h-14 shrink-0 object-contain"
                    />
                </div>

                <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#86EFAC] block">
                        Republic of the Philippines - Province of Bulacan
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white leading-tight mt-1 font-display">
                        MUNICIPALITY OF SANTA MARIA
                    </h1>
                    <p className="text-xs text-[#CBD5E1] mt-1 font-docket">
                        Office of the Municipal Administrator
                    </p>
                    <div className="inline-block mt-2 px-2 py-0.5 bg-[#0B2545] border border-white/20 rounded font-mono text-[10px] text-[#FCD116]">
                        DOCSYS v2.6 [ARTA RA 11032]
                    </div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10 rounded space-y-2 text-xs text-[#CBD5E1]">
                    <div className="flex items-center gap-2 text-white font-bold text-[11px] uppercase tracking-wider">
                        <ShieldCheck size={14} className="text-[#86EFAC]" />
                        <span>Statutory Security Mandate</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                        Pursuant to Republic Act 10173 (Data Privacy Act of 2012) and Republic Act
                        10175 (Cybercrime Prevention Act), access to this executive docket and
                        records repository is restricted strictly to authorized Civil Service
                        personnel.
                    </p>
                    <p className="leading-relaxed text-[11px] text-[#94A3B8]">
                        All session logins, status updates, and document transmissions are recorded
                        in the immutable statutory audit custody chain.
                    </p>
                </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-[10px] text-[#94A3B8] font-mono">
                <div>IDENTITY: KEYCLOAK REALM [DOCSYS]</div>
                <div>SECURITY: TLS 1.3 / OIDC AUTHORIZATION CODE + PKCE</div>
            </div>
        </div>
    );
}
