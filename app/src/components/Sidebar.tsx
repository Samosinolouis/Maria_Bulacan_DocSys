'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  FileEdit,
  FileCheck,
  Send,
  Archive,
  Calendar,
  BarChart3,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  desktopCollapsed?: boolean;
  onToggleDesktopCollapse?: () => void;
}

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
  desktopCollapsed: controlledCollapsed,
  onToggleDesktopCollapse: controlledToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const { incomingCount, reviewCount, overdueCount } = useApp();

  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Synchronize with localStorage for persistent state across navigation
  useEffect(() => {
    try {
      const saved = localStorage.getItem('docsys_desktop_sidebar_collapsed');
      if (saved !== null) {
        setInternalCollapsed(saved === 'true');
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (controlledToggle) {
      controlledToggle();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('docsys_desktop_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const NAV_SECTIONS = [
    {
      roman: 'I',
      division: 'INTAKE & REGISTRY',
      items: [
        {
          id: 'dashboard',
          href: '/dashboard',
          label: 'Executive Command Center',
          subLabel: 'Overview and Live ARTA SLA',
          icon: LayoutDashboard,
          count: null,
          alert: overdueCount > 0,
        },
        {
          id: 'incoming',
          href: '/incoming',
          label: 'Reception & Screening',
          subLabel: 'Intake completeness audit',
          icon: Inbox,
          count: incomingCount,
          alert: false,
        },
      ],
    },
    {
      roman: 'II',
      division: 'EXECUTIVE REVIEW & ARCHIVE',
      items: [
        {
          id: 'prepare',
          href: '/prepare',
          label: 'Document Preparation',
          subLabel: 'Official drafting studio',
          icon: FileEdit,
          count: null,
          alert: false,
        },
        {
          id: 'review',
          href: '/review',
          label: 'Signature & Endorsement',
          subLabel: 'MA and Mayor review desk',
          icon: FileCheck,
          count: reviewCount,
          alert: overdueCount > 0,
        },
        {
          id: 'transmit',
          href: '/transmit',
          label: 'Transmission Desk',
          subLabel: 'Outgoing transmittals',
          icon: Send,
          count: null,
          alert: false,
        },
        {
          id: 'archive',
          href: '/archive',
          label: 'Municipal Records Archive',
          subLabel: 'Digitized permanent records',
          icon: Archive,
          count: null,
          alert: false,
        },
      ],
    },
    {
      roman: 'III',
      division: 'LOGISTICS & COMPLIANCE',
      items: [
        {
          id: 'schedule',
          href: '/schedule',
          label: 'Venue & Gavel Calendar',
          subLabel: '6 Municipal venues',
          icon: Calendar,
          count: null,
          alert: false,
        },
        {
          id: 'reports',
          href: '/reports',
          label: 'ARTA Compliance Ledger',
          subLabel: 'RA 11032 statutory metrics',
          icon: BarChart3,
          count: null,
          alert: false,
        },
        {
          id: 'admin',
          href: '/admin',
          label: 'Statutory Audit Trail',
          subLabel: 'Immutable chain of custody',
          icon: ShieldAlert,
          count: null,
          alert: false,
        },
      ],
    },
  ];

  // Render navigation links for expanded view (Desktop expanded & Mobile drawer)
  const renderExpandedContent = (isMobile: boolean) => (
    <>
      <div className="space-y-5">
        {isMobile ? (
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-white">
            <span className="font-cinzel text-xs font-bold tracking-wider text-[#86EFAC]">
              MUNICIPAL NAVIGATION
            </span>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-1.5 rounded text-[#94A3B8] hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <span className="font-cinzel text-[11px] font-bold tracking-widest text-[#86EFAC] uppercase">
              MUNICIPAL REGISTRY
            </span>
            <button
              type="button"
              onClick={handleToggle}
              title="Minimize sidebar to icon rail"
              aria-label="Minimize sidebar"
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-[#94A3B8] hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
            >
              <PanelLeftClose size={15} />
              <span className="text-[10px]">Minimize</span>
            </button>
          </div>
        )}

        {NAV_SECTIONS.map((section) => (
          <div key={section.roman} className="space-y-1">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold tracking-widest text-[#94A3B8] border-b border-white/10 uppercase">
              <span>
                {section.roman}. {section.division}
              </span>
            </div>

            <div className="pt-1 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.id === 'dashboard' && (pathname === '/' || pathname === ''));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      if (isMobile && onCloseMobile) {
                        onCloseMobile();
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer relative ${
                      isActive
                        ? 'bg-[#0B2545] text-[#FFFFFF] font-bold shadow-inner'
                        : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white hover:translate-x-0.5'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#15803D] rounded-r transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={16}
                        className={isActive ? 'text-[#86EFAC]' : 'text-[#94A3B8]'}
                      />
                      <div className="truncate">
                        <div className="text-xs truncate">{item.label}</div>
                        <div className="text-[10px] text-[#94A3B8] truncate">{item.subLabel}</div>
                      </div>
                    </div>

                    {item.count !== null && item.count > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors duration-150 ${
                          item.alert
                            ? 'bg-[#1E293B] text-white border border-[#475569]'
                            : 'bg-[#15803D] text-white'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Municipal Seal Watermark & Session Badge */}
      <div className="mt-6 pt-4 border-t border-white/10 px-3 text-[11px] text-[#94A3B8]">
        <div className="font-semibold text-white">Santa Maria Civil Registry</div>
        <div className="font-mono text-[10px] mt-0.5 text-[#CBD5E1]">Session: Active Encrypted</div>
      </div>
    </>
  );

  // Render minimized icon-only rail for desktop
  const renderCollapsedContent = () => (
    <>
      <div className="space-y-4">
        {/* Expand Toggle Button */}
        <div className="flex flex-col items-center pb-2 border-b border-white/10">
          <button
            type="button"
            onClick={handleToggle}
            title="Expand sidebar navigation"
            aria-label="Expand sidebar"
            className="p-2 rounded text-[#86EFAC] hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <PanelLeftOpen size={18} />
          </button>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div key={section.roman} className="space-y-1">
            {/* Roman section badge / divider */}
            <div
              className="text-center py-0.5 text-[9px] font-mono font-bold text-[#64748B] border-b border-white/10"
              title={`${section.roman}. ${section.division}`}
            >
              {section.roman}
            </div>

            <div className="space-y-1 pt-1 flex flex-col items-center">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.id === 'dashboard' && (pathname === '/' || pathname === ''));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={`${item.label} — ${item.subLabel}`}
                    className={`w-12 h-11 flex items-center justify-center rounded transition-all duration-200 relative group cursor-pointer ${
                      isActive
                        ? 'bg-[#0B2545] text-white shadow-inner'
                        : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#15803D] rounded-r" />
                    )}

                    <div className="relative flex items-center justify-center">
                      <Icon
                        size={19}
                        className={isActive ? 'text-[#86EFAC]' : 'text-[#94A3B8] group-hover:text-white'}
                      />
                      {item.count !== null && item.count > 0 && (
                        <span
                          className={`absolute -top-2 -right-2.5 min-w-[17px] h-4 px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow border ${
                            item.alert
                              ? 'bg-[#DC2626] text-white border-white/20'
                              : 'bg-[#15803D] text-white border-[#86EFAC]/40'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Compact Session Indicator */}
      <div
        className="mt-6 pt-4 border-t border-white/10 flex flex-col items-center justify-center cursor-default"
        title="Santa Maria Civil Registry - Active Encrypted Session"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[#15803D] ring-2 ring-[#86EFAC]/40 animate-pulse" />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Collapsible Rail) */}
      <aside
        className={`hidden lg:flex transition-all duration-300 ease-in-out shrink-0 bg-[#081E36] text-[#E2E8F0] border-r border-[#0B2545] flex-col justify-between ${
          isCollapsed ? 'w-20 p-2.5' : 'w-72 p-3'
        }`}
      >
        {isCollapsed ? renderCollapsedContent() : renderExpandedContent(false)}
      </aside>

      {/* Mobile / Tablet Drawer Overlay (Always Full) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fluid-fade"
            onClick={onCloseMobile}
          />
          {/* Drawer Pane */}
          <aside className="relative w-72 max-w-[85vw] bg-[#081E36] text-[#E2E8F0] shadow-2xl flex flex-col justify-between p-3 overflow-y-auto z-10 animate-fluid-tab">
            {renderExpandedContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
