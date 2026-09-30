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
    <aside className="w-full lg:w-72 bg-white text-[#0F172A] shrink-0 border-r border-[#CBD5E1] p-3 flex flex-col justify-between">
      <div className="space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.roman} className="space-y-1">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono font-bold tracking-widest text-[#64748B] border-b border-[#E2E8F0] uppercase">
              <span>
                [{section.roman}. {section.division}]
              </span>
            </div>

            <div className="pt-1 space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.id === 'dashboard' && (pathname === '/' || pathname === ''));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-[#F1F5F9] border-[#0F172A] font-bold text-[#0F172A]'
                        : 'bg-white border-transparent text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 border border-dashed border-[#94A3B8] rounded flex items-center justify-center bg-[#F8FAFC]">
                        <Icon size={13} className="text-[#475569]" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs truncate">{item.label}</div>
                        <div className="text-[10px] text-[#94A3B8] truncate">{item.subLabel}</div>
                      </div>
                    </div>

                    {item.count !== null && item.count > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 border border-[#94A3B8] bg-white text-[#0F172A] rounded">
                        [{item.count}]
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Wireframe Watermark Box */}
      <div className="mt-6 pt-4 border-t border-[#CBD5E1] px-3">
        <div className="p-3 border border-dashed border-[#94A3B8] bg-[#F8FAFC] rounded text-center">
          <div className="text-[10px] font-mono font-bold text-[#64748B]">[ SANTA MARIA DOCSYS ]</div>
          <div className="text-[9px] font-mono text-[#94A3B8] mt-0.5">[ WIREFRAME SKELETON v1.0 ]</div>
        </div>
      </div>
    </aside>
  );
}
