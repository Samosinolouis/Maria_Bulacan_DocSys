'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  DocumentRecord,
  DocumentStatus,
  EventBooking,
  User,
  AuditEntry,
} from '@/lib/types';
import {
  CLEAN_USERS,
  CLEAN_DOCUMENTS,
  CLEAN_EVENTS,
  CLEAN_AUDIT_LOGS,
} from '@/lib/cleanData';
import { VENUE_LABELS } from '@/lib/data';
import {
  insertDocument,
  updateDocumentStatusInDb,
  insertEvent,
  insertAuditLog,
} from '@/lib/repository';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  logout: () => void;
  documents: DocumentRecord[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentRecord[]>>;
  events: EventBooking[];
  setEvents: React.Dispatch<React.SetStateAction<EventBooking[]>>;
  auditLogs: AuditEntry[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  selectedDoc: DocumentRecord | null;
  setSelectedDoc: (doc: DocumentRecord | null) => void;
  routingSlipDoc: DocumentRecord | null;
  setRoutingSlipDoc: (doc: DocumentRecord | null) => void;
  newIntakeOpen: boolean;
  setNewIntakeOpen: (open: boolean) => void;
  newEventOpen: boolean;
  setNewEventOpen: (open: boolean) => void;
  incomingCount: number;
  reviewCount: number;
  overdueDocs: DocumentRecord[];
  overdueCount: number;
  approvedCount: number;
  closedCount: number;
  filteredDocuments: DocumentRecord[];
  handleUpdateStatus: (docId: string, newStatus: DocumentStatus, note?: string) => void;
  handleAddNewDocument: (newDoc: DocumentRecord) => void;
  handleAddNewEvent: (newEvent: EventBooking) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(CLEAN_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [documents, setDocuments] = useState<DocumentRecord[]>(CLEAN_DOCUMENTS);
  const [events, setEvents] = useState<EventBooking[]>(CLEAN_EVENTS);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(CLEAN_AUDIT_LOGS);

  // Restore authenticated session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsys_session_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          setIsAuthenticated(true);
        } catch {
          // Keep default
        }
      }
    }
  }, []);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('docsys_session_user');
    }
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [routingSlipDoc, setRoutingSlipDoc] = useState<DocumentRecord | null>(null);
  const [newIntakeOpen, setNewIntakeOpen] = useState(false);
  const [newEventOpen, setNewEventOpen] = useState(false);

  // Derived Counts
  const incomingCount = useMemo(
    () => documents.filter((d) => d.status === 'SCREENING' || d.status === 'RECEIVED').length,
    [documents]
  );
  const reviewCount = useMemo(
    () => documents.filter((d) => d.status === 'REVIEW').length,
    [documents]
  );
  const overdueDocs = useMemo(
    () => documents.filter((d) => d.isOverdue || (d.status === 'REVIEW' && d.priority === 'URGENT')),
    [documents]
  );
  const overdueCount = overdueDocs.length;
  const approvedCount = useMemo(
    () => documents.filter((d) => d.status === 'APPROVED' || d.status === 'ENDORSED').length,
    [documents]
  );
  const closedCount = useMemo(
    () => documents.filter((d) => d.status === 'CLOSED').length,
    [documents]
  );

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.controlNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.requestingParty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.originOffice.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'ALL' || doc.type === filterType;
      const matchesStatus = filterStatus === 'ALL' || doc.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, filterType, filterStatus]);

  // Handlers
  const handleUpdateStatus = (docId: string, newStatus: DocumentStatus, note?: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            denialReason: newStatus === 'DENIED' ? note : doc.denialReason,
            endorsementNotes: newStatus === 'ENDORSED' ? note : doc.endorsementNotes,
          };
        }
        return doc;
      })
    );

    const newLog: AuditEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      documentId: docId,
      action:
        newStatus === 'APPROVED'
          ? 'APPROVED'
          : newStatus === 'ENDORSED'
          ? 'ENDORSED'
          : newStatus === 'DENIED'
          ? 'DENIED'
          : newStatus === 'TRANSMITTED'
          ? 'TRANSMITTED'
          : 'ARCHIVED',
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      details: note || `Status updated to ${newStatus}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    updateDocumentStatusInDb(docId, newStatus, note).catch((e) =>
      console.warn('PostgreSQL update deferred:', e)
    );
    insertAuditLog(newLog).catch((e) => console.warn('PostgreSQL audit log deferred:', e));

    if (selectedDoc && selectedDoc.id === docId) {
      setSelectedDoc((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              denialReason: newStatus === 'DENIED' ? note : prev.denialReason,
              endorsementNotes: newStatus === 'ENDORSED' ? note : prev.endorsementNotes,
            }
          : null
      );
    }
  };

  const handleAddNewDocument = (newDoc: DocumentRecord) => {
    setDocuments((prev) => [newDoc, ...prev]);
    const newLog: AuditEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      documentId: newDoc.id,
      action: 'RECEIVED',
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      details: `New document logged at reception desk. Control Number: ${newDoc.controlNumber}. Subject: ${newDoc.title}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    insertDocument(newDoc).catch((e) => console.warn('PostgreSQL insert deferred:', e));
    insertAuditLog(newLog).catch((e) => console.warn('PostgreSQL audit log deferred:', e));
    setNewIntakeOpen(false);
  };

  const handleAddNewEvent = (newEvent: EventBooking) => {
    setEvents((prev) => [newEvent, ...prev]);
    const newLog: AuditEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      eventId: newEvent.id,
      action: 'SCHEDULED_EVENT',
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      details: `Scheduled event: ${newEvent.title} at ${VENUE_LABELS[newEvent.venue]?.label || newEvent.venue} on ${newEvent.date} (${newEvent.startTime} - ${newEvent.endTime})`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    insertEvent(newEvent).catch((e) => console.warn('PostgreSQL event insert deferred:', e));
    insertAuditLog(newLog).catch((e) => console.warn('PostgreSQL audit log deferred:', e));
    setNewEventOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        setIsAuthenticated,
        logout,
        documents,
        setDocuments,
        events,
        setEvents,
        auditLogs,
        searchQuery,
        setSearchQuery,
        filterType,
        setFilterType,
        filterStatus,
        setFilterStatus,
        selectedDoc,
        setSelectedDoc,
        routingSlipDoc,
        setRoutingSlipDoc,
        newIntakeOpen,
        setNewIntakeOpen,
        newEventOpen,
        setNewEventOpen,
        incomingCount,
        reviewCount,
        overdueDocs,
        overdueCount,
        approvedCount,
        closedCount,
        filteredDocuments,
        handleUpdateStatus,
        handleAddNewDocument,
        handleAddNewEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
