'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import GovMasthead from '@/components/GovMasthead';
import GovHeader from '@/components/GovHeader';
import Sidebar from '@/components/Sidebar';
import GovFooter from '@/components/GovFooter';
import DocumentDetailModal from '@/components/DocumentDetailModal';
import RoutingSlipModal from '@/components/RoutingSlipModal';
import NewIntakeModal from '@/components/NewIntakeModal';
import EventModal from '@/components/EventModal';
import { useApp } from '@/context/AppContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    currentUser,
    setCurrentUser,
    logout,
    setNewIntakeOpen,
    newIntakeOpen,
    newEventOpen,
    setNewEventOpen,
    selectedDoc,
    setSelectedDoc,
    routingSlipDoc,
    setRoutingSlipDoc,
    handleUpdateStatus,
    handleAddNewDocument,
    handleAddNewEvent,
    events,
    auditLogs,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dedicated full-canvas rendering for login portal
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* 1. National Trust Masthead */}
      <GovMasthead />

      {/* 2. Official Dual-Logo Letterhead Header */}
      <GovHeader
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        onOpenIntake={() => setNewIntakeOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onLogout={logout}
      />

      {/* 3. Main Operational Area */}
      <div className="flex-1 w-full flex flex-col lg:flex-row bg-white relative">
        {/* Left Registry Navigation (Desktop + Mobile Drawer) */}
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Right Page View */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-x-hidden bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* 4. Official GWTS Compliance Footer */}
      <GovFooter />

        {/* Global Modals */}
        {selectedDoc && (
          <DocumentDetailModal
            document={selectedDoc}
            currentUser={currentUser}
            auditLogs={auditLogs}
            onClose={() => setSelectedDoc(null)}
            onUpdateStatus={handleUpdateStatus}
            onPrintRoutingSlip={(doc) => setRoutingSlipDoc(doc)}
          />
        )}

        {routingSlipDoc && (
          <RoutingSlipModal
            document={routingSlipDoc}
            onClose={() => setRoutingSlipDoc(null)}
          />
        )}

        {newIntakeOpen && (
          <NewIntakeModal
            currentUser={currentUser}
            onClose={() => setNewIntakeOpen(false)}
            onSubmit={handleAddNewDocument}
          />
        )}

        {newEventOpen && (
          <EventModal
            existingEvents={events}
            onClose={() => setNewEventOpen(false)}
            onSubmit={handleAddNewEvent}
          />
        )}
      </div>
  );
}
