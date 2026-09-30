import { DocumentRecord, EventBooking, User, AuditEntry } from './types';

export const CLEAN_USERS: User[] = [
  {
    id: 'usr-admin-01',
    fullName: 'Engr. Elmer B. Clemente',
    role: 'ADMINISTRATOR',
    title: 'Municipal Administrator',
    department: 'Office of the Municipal Administrator',
    email: 'admin@santamaria.gov.ph',
  },
  {
    id: 'usr-ea-02',
    fullName: 'Benito C. Fabian',
    role: 'EXECUTIVE_ASSISTANT',
    title: 'Executive Assistant II',
    department: 'Office of the Municipal Administrator',
    email: 'ea.fabian@santamaria.gov.ph',
  },
  {
    id: 'usr-mayor-03',
    fullName: 'Hon. Bartolome',
    role: 'ADMINISTRATOR',
    title: 'Municipal Mayor',
    department: 'Office of the Municipal Mayor',
    email: 'mayor@santamaria.gov.ph',
  },
  {
    id: 'usr-officer-04',
    fullName: 'Officer J. Garcia',
    role: 'OFFICER',
    title: 'Administrative Officer IV',
    department: 'Office of the Municipal Administrator',
    email: 'jgarcia@santamaria.gov.ph',
  },
  {
    id: 'usr-legal-05',
    fullName: 'Atty. Rodrigo Ramos',
    role: 'OFFICER',
    title: 'Senior Legal Officer',
    department: 'Municipal Legal Office',
    email: 'legal@santamaria.gov.ph',
  },
  {
    id: 'usr-clerk-06',
    fullName: 'Sherelyn O. Libao',
    role: 'CLERK_ENCODER',
    title: 'Administrative Officer IV (Records Custodian)',
    department: 'Central Receiving Desk',
    email: 'records.slibao@santamaria.gov.ph',
  },
];

// Clean Slate: 0 documents, 0 events, 0 audit logs for production readiness
export const CLEAN_DOCUMENTS: DocumentRecord[] = [];
export const CLEAN_EVENTS: EventBooking[] = [];
export const CLEAN_AUDIT_LOGS: AuditEntry[] = [];
