/**
 * MUNICIPALITY OF SANTA MARIA, BULACAN
 * Document Tracking System (DocSys) - Data Access Repository Layer
 * 
 * Provides robust state persistence for Municipal Civil Service records,
 * integrating clean plantilla datasets, localStorage cache, and optional
 * REST API synchronization with Azure PostgreSQL Flexible Server.
 */

import {
  DocumentRecord,
  DocumentStatus,
  EventBooking,
  User,
  AuditEntry,
  AuditAction,
  TransmissionRecord,
  Attachment,
} from './types';
import {
  CLEAN_USERS,
  CLEAN_DOCUMENTS,
  CLEAN_EVENTS,
  CLEAN_AUDIT_LOGS,
} from './cleanData';

const STORAGE_KEYS = {
  DOCUMENTS: 'docsys_municipal_documents_v3',
  EVENTS: 'docsys_municipal_events_v3',
  AUDIT: 'docsys_municipal_audit_v3',
  USERS: 'docsys_municipal_users_v3',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

if (isBrowser()) {
  try {
    localStorage.removeItem('docsys_municipal_documents_v2');
    localStorage.removeItem('docsys_municipal_events_v2');
    localStorage.removeItem('docsys_municipal_audit_v2');
    localStorage.removeItem('docsys_municipal_users_v2');
  } catch {}
}

function getStoredItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[DocSys Storage] Error reading key "${key}":`, e);
    return fallback;
  }
}

function setStoredItem<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[DocSys Storage] Error saving key "${key}":`, e);
  }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export async function fetchUsers(): Promise<User[]> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setStoredItem(STORAGE_KEYS.USERS, data);
        return data;
      }
    } catch {
      // Fall through to storage / clean fallback
    }
  }
  return getStoredItem<User[]>(STORAGE_KEYS.USERS, CLEAN_USERS);
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
export async function fetchDocuments(): Promise<DocumentRecord[]> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setStoredItem(STORAGE_KEYS.DOCUMENTS, data);
        return data;
      }
    } catch {
      // Fall through to storage / clean fallback
    }
  }
  return getStoredItem<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, CLEAN_DOCUMENTS);
}

export async function insertDocument(doc: DocumentRecord): Promise<void> {
  const current = getStoredItem<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, CLEAN_DOCUMENTS);
  const updated = [doc, ...current.filter((d) => d.id !== doc.id)];
  setStoredItem(STORAGE_KEYS.DOCUMENTS, updated);

  // Record audit entry
  const newAudit: AuditEntry = {
    id: `aud-${Date.now()}`,
    documentId: doc.id,
    action: 'RECEIVED',
    userId: 'usr-clerk-05',
    userName: 'Juan Dela Cruz',
    userRole: 'CLERK_ENCODER',
    timestamp: new Date().toISOString(),
    details: `Document officially logged into docket with Control No. ${doc.controlNumber}`,
  };
  addAuditLogEntry(newAudit);

  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
    } catch (e) {
      console.warn('[DocSys API] Sync insert failed:', e);
    }
  }
}

export async function attachDocumentToDocket(
  docId: string,
  attachment: Attachment,
  user?: User
): Promise<DocumentRecord | null> {
  const current = getStoredItem<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, CLEAN_DOCUMENTS);
  const target = current.find((d) => d.id === docId);
  if (!target) return null;

  const updatedDoc: DocumentRecord = {
    ...target,
    attachments: [...(target.attachments || []), attachment],
    updatedAt: new Date().toISOString(),
  };

  const updated = current.map((d) => (d.id === docId ? updatedDoc : d));
  setStoredItem(STORAGE_KEYS.DOCUMENTS, updated);

  // Record audit entry
  const newAudit: AuditEntry = {
    id: `aud-${Date.now()}`,
    documentId: docId,
    action: 'ASSIGNED',
    userId: user?.id || 'usr-clerk-05',
    userName: user?.fullName || 'Sherelyn O. Libao',
    userRole: user?.role || 'CLERK_ENCODER',
    timestamp: new Date().toISOString(),
    details: `Attached official annex/record: "${attachment.fileName}" (${attachment.fileSize}) to docket ${updatedDoc.controlNumber}`,
  };
  addAuditLogEntry(newAudit);

  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/api/documents/${docId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attachment),
      });
    } catch (e) {
      console.warn('[DocSys API] Sync attachment failed:', e);
    }
  }

  return updatedDoc;
}

export async function updateDocumentRecord(doc: DocumentRecord): Promise<void> {
  const current = getStoredItem<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, CLEAN_DOCUMENTS);
  const updated = current.map((d) => (d.id === doc.id ? doc : d));
  setStoredItem(STORAGE_KEYS.DOCUMENTS, updated);

  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
    } catch (e) {
      console.warn('[DocSys API] Sync update failed:', e);
    }
  }
}

export async function updateDocumentStatusInDb(
  docId: string,
  newStatus: DocumentStatus,
  note?: string
): Promise<void> {
  const current = getStoredItem<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, CLEAN_DOCUMENTS);
  const updated = current.map((d) => {
    if (d.id === docId) {
      return {
        ...d,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        denialReason: newStatus === 'DENIED' ? note || d.denialReason : d.denialReason,
        endorsementNotes: newStatus === 'ENDORSED' ? note || d.endorsementNotes : d.endorsementNotes,
      };
    }
    return d;
  });
  setStoredItem(STORAGE_KEYS.DOCUMENTS, updated);

  // Record audit entry
  const targetDoc = current.find((d) => d.id === docId);
  const auditAction: AuditAction =
    newStatus === 'ENDORSED'
      ? 'ENDORSED'
      : newStatus === 'DENIED'
      ? 'DENIED'
      : 'ASSIGNED';

  const newAudit: AuditEntry = {
    id: `aud-${Date.now()}`,
    documentId: docId,
    action: auditAction,
    userId: 'usr-admin-01',
    userName: 'Engr. Elmer B. Clemente',
    userRole: 'ADMINISTRATOR',
    timestamp: new Date().toISOString(),
    details: note || `Docket ${targetDoc?.controlNumber || docId} status transitioned to ${newStatus}`,
  };
  addAuditLogEntry(newAudit);

  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/api/documents/${docId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note }),
      });
    } catch (e) {
      console.warn('[DocSys API] Sync status update failed:', e);
    }
  }
}

export async function insertTransmissionInDb(
  docId: string,
  transmission: TransmissionRecord
): Promise<void> {
  const current = getStoredItem<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, CLEAN_DOCUMENTS);
  const updated = current.map((d) => {
    if (d.id === docId) {
      return {
        ...d,
        status: 'TRANSMITTED' as DocumentStatus,
        updatedAt: new Date().toISOString(),
        transmissionDetails: transmission,
      };
    }
    return d;
  });
  setStoredItem(STORAGE_KEYS.DOCUMENTS, updated);

  const targetDoc = current.find((d) => d.id === docId);
  const newAudit: AuditEntry = {
    id: `aud-${Date.now()}`,
    documentId: docId,
    action: 'TRANSMITTED',
    userId: 'usr-records-03',
    userName: 'Ma. Cristina Perez',
    userRole: 'OFFICER',
    timestamp: new Date().toISOString(),
    details: `Official physical transmission to ${transmission.transmittedToOffice}. Received by: ${transmission.receivedBy}`,
  };
  addAuditLogEntry(newAudit);

  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/api/transmissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId,
          ...transmission,
        }),
      });
    } catch (e) {
      console.warn('[DocSys API] Sync transmission failed:', e);
    }
  }
}

// ---------------------------------------------------------------------------
// Events & Venues
// ---------------------------------------------------------------------------
export async function fetchEvents(): Promise<EventBooking[]> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setStoredItem(STORAGE_KEYS.EVENTS, data);
        return data;
      }
    } catch {
      // Fall through to storage / clean fallback
    }
  }
  return getStoredItem<EventBooking[]>(STORAGE_KEYS.EVENTS, CLEAN_EVENTS);
}

export async function insertEvent(evt: EventBooking): Promise<void> {
  const current = getStoredItem<EventBooking[]>(STORAGE_KEYS.EVENTS, CLEAN_EVENTS);
  const updated = [...current, evt];
  setStoredItem(STORAGE_KEYS.EVENTS, updated);

  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt),
      });
    } catch (e) {
      console.warn('[DocSys API] Sync event booking failed:', e);
    }
  }
}

// ---------------------------------------------------------------------------
// Audit Trail
// ---------------------------------------------------------------------------
export async function fetchAuditLogs(): Promise<AuditEntry[]> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setStoredItem(STORAGE_KEYS.AUDIT, data);
        return data;
      }
    } catch {
      // Fall through to storage / clean fallback
    }
  }
  return getStoredItem<AuditEntry[]>(STORAGE_KEYS.AUDIT, CLEAN_AUDIT_LOGS);
}

export async function addAuditLogEntry(entry: AuditEntry): Promise<void> {
  const current = getStoredItem<AuditEntry[]>(STORAGE_KEYS.AUDIT, CLEAN_AUDIT_LOGS);
  const updated = [entry, ...current.slice(0, 99)]; // retain recent 100 entries
  setStoredItem(STORAGE_KEYS.AUDIT, updated);
}

export const insertAuditLog = addAuditLogEntry;
