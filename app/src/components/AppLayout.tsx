'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import GovMasthead from '@/components/GovMasthead';
import GovHeader from '@/components/GovHeader';
import Sidebar from '@/components/Sidebar';
import GovFooter from '@/components/GovFooter';
import DocumentDetailModal from '@/components/DocumentDetailModal';
import RoutingSlipModal from '@/components/RoutingSlipModal';
import OfficialWordDocument from '@/components/OfficialWordDocument';
import NewIntakeModal from '@/components/NewIntakeModal';
import EventModal from '@/components/EventModal';
import { useApp } from '@/providers/AppProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    currentUser,
    logout,
    newIntakeOpen,
    setNewIntakeOpen,
    newEventOpen,
    setNewEventOpen,
    selectedRequest,
    setSelectedRequest,
    routingSlipRequest,
    setRoutingSlipRequest,
    wordPreviewRequest,
    setWordPreviewRequest,
    refreshCounts,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dedicated full-canvas rendering for the login portal and OIDC callback.
  if (pathname === '/login' || pathname?.startsWith('/auth/callback')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <GovMasthead />

      <GovHeader
        currentUser={currentUser}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onLogout={logout}
      />

      <div className="flex-1 w-full flex flex-col lg:flex-row bg-white relative">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-x-hidden bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      <GovFooter />

      {/* Global modals (the owning view decides what happens on submit). */}
      {selectedRequest && (
        <DocumentDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      {routingSlipRequest && (
        <RoutingSlipModal request={routingSlipRequest} onClose={() => setRoutingSlipRequest(null)} />
      )}

      {wordPreviewRequest && (
        <div
          className="fixed inset-0 bg-[#081E36]/80 z-60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fluid-fade printable-modal-container"
          onClick={() => setWordPreviewRequest(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[96vh] overflow-y-auto my-auto print:max-h-none print:overflow-visible print:my-0"
            onClick={(e) => e.stopPropagation()}
          >
            <OfficialWordDocument
              request={wordPreviewRequest}
              onClose={() => setWordPreviewRequest(null)}
              showToolbar={true}
            />
          </div>
        </div>
      )}

      {newIntakeOpen && (
        <NewIntakeModal
          onClose={() => setNewIntakeOpen(false)}
          onSubmitted={() => {
            setNewIntakeOpen(false);
            refreshCounts();
          }}
        />
      )}

      {newEventOpen && (
        <EventModal
          onClose={() => setNewEventOpen(false)}
          onSubmitted={() => {
            setNewEventOpen(false);
            refreshCounts();
          }}
        />
      )}
    </div>
  );
}
