'use client';

import Image from 'next/image';
import { UserCheck, Menu, X, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import type { AppUser } from '@/providers/AppProvider';

interface GovHeaderProps {
  currentUser: AppUser;
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
}

/**
 * Letterhead header. The identity is the authenticated Keycloak session (loaded
 * through `me`); there is no persona switcher - roles come from the backend.
 */
export default function GovHeader({
  currentUser,
  mobileMenuOpen,
  onToggleMobileMenu,
  onLogout,
}: GovHeaderProps) {
  return (
    <header className="gov-header relative z-30">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
              <Image
                src="/assets/santa-maria-seal.png"
                alt="Official Seal of the Municipality of Santa Maria, Bulacan"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-[#15803D]">
                Republic of the Philippines - Province of Bulacan
              </span>
              <h1 className="font-cinzel text-base sm:text-lg md:text-xl font-bold tracking-wide text-[#081E36] leading-tight">
                MUNICIPALITY OF SANTA MARIA
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                <span className="font-serif-docket text-[11px] sm:text-xs font-semibold text-[#166534]">
                  Office of the Municipal Administrator
                </span>
                <span className="text-[#CBD5E1] hidden sm:inline">|</span>
                <span className="font-mono-control text-[10px] sm:text-[11px] font-bold text-[#081E36] tracking-tight">
                  DOCSYS v2.6 [ARTA RA 11032]
                </span>
              </div>
            </div>

            <div className="relative h-12 w-auto hidden md:block shrink-0 ml-2 border-l border-[#E2E8F0] pl-4">
              <Image
                src="/assets/bagong-pilipinas-logo.webp"
                alt="Bagong Pilipinas Official Seal"
                width={48}
                height={48}
                className="object-contain h-12 w-auto"
                priority
              />
            </div>
          </div>

          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded text-[#081E36] hover:bg-[#F1F5F9] border border-[#CBD5E1] cursor-pointer shrink-0 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t border-[#E2E8F0] lg:border-t-0">
          <NotificationBell />

          <div className="flex-1 lg:flex-none flex items-center gap-2 bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs min-w-0">
            <UserCheck size={16} className="text-[#081E36] shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[9px] uppercase font-bold text-[#64748B]">Active Account</span>
              <span className="font-bold text-[#081E36] text-xs truncate">
                {currentUser.fullName}
                {currentUser.title ? ` (${currentUser.title})` : ''}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out of Civil Service Session"
              className="btn-fluid flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] hover:text-[#081E36] rounded text-xs font-bold cursor-pointer shrink-0"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
