'use client';

import React from 'react';
import { User } from '@/lib/types';
import { CURRENT_USERS } from '@/lib/data';

interface GovHeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onOpenIntake: () => void;
}

export default function GovHeader({ currentUser, onUserChange, onOpenIntake }: GovHeaderProps) {
  return (
    <header className="bg-white border-b-2 border-[#94A3B8] px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Wireframe Logo & Title Block */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 border-2 border-dashed border-[#94A3B8] bg-[#F8FAFC] flex flex-col items-center justify-center text-[9px] text-[#64748B] font-mono rounded">
            <span>[ SEAL ]</span>
          </div>

          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#64748B] uppercase">
              [ MUNICIPALITY OF SANTA MARIA &bull; PROVINCE OF BULACAN ]
            </div>
            <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">
              [ DOCUMENT MANAGEMENT & STATUTORY OPERATIONS SYSTEM ]
            </h1>
            <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5">
              <span>[ OFFICE OF THE MUNICIPAL ADMINISTRATOR ]</span>
              <span>&bull;</span>
              <span className="font-mono">[ 72-HOUR SLA ENFORCEMENT ]</span>
            </div>
          </div>
        </div>

        {/* Wireframe Right Actions & User Pill */}
        <div className="flex items-center gap-3">
          {/* Wireframe Intake Button */}
          <button
            onClick={onOpenIntake}
            className="wf-btn px-4 py-2 border-2 border-[#0F172A] text-xs font-bold bg-white text-[#0F172A] hover:bg-[#F1F5F9] rounded cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span>
            <span>[ INTAKE DOCKET ]</span>
          </button>

          {/* Wireframe User Selector Dropdown */}
          <div className="border border-[#CBD5E1] bg-white rounded p-1.5 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-dashed border-[#94A3B8] bg-[#F1F5F9] flex items-center justify-center text-[10px] font-mono text-[#64748B]">
              [U]
            </div>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = CURRENT_USERS.find((u) => u.id === e.target.value);
                if (user) onUserChange(user);
              }}
              className="text-xs bg-transparent text-[#0F172A] font-medium focus:outline-none cursor-pointer"
            >
              {CURRENT_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
