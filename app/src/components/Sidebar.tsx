'use client';

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
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { incomingCount, reviewCount, overdueCount } = useApp();

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

  return (
    <aside className="w-full lg:w-72 bg-[#081E36] text-[#E2E8F0] shrink-0 border-r border-[#0B2545] p-3 flex flex-col justify-between">
      <div className="space-y-6">
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
    </aside>
  );
}
