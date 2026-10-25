// DEMONSTRATION DATA — see demoDatabase.ts.
import { AppError } from '../../models/errors';
import type { MedicalDocument } from '../../models/MedicalDocument';
import type { DocumentRepository } from '../documentRepository';
import { demoRequest, findAccessibleProfile, newDemoId, nowIso, removeWhere, requireDemoAccount } from './demoDatabase';

const SEED_TIME = '2026-10-01T09:00:00.000Z';

// Demo files only: no real file is stored, just a name and a type.
const documents: MedicalDocument[] = [
  {
    id: 'demo-document-1',
    version: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    profileId: 'demo-profile-father',
    title: 'Blood test results',
    category: 'lab report',
    relevantDate: '2026-09-28',
    fileName: 'blood-test-demo.pdf',
    fileType: 'pdf',
  },
  {
    id: 'demo-document-2',
    version: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    profileId: 'demo-profile-father',
    title: 'Chest X-ray',
    category: 'scan',
    relevantDate: '2026-08-15',
    fileName: 'chest-xray-demo.jpg',
    fileType: 'image',
  },
];

// Checks the caller may use the profile, like row-level security would.
function checkAccess(profileId: string) {
  findAccessibleProfile(profileId, requireDemoAccount().id);
}

function findOwn(profileId: string, id: string): MedicalDocument {
  const found = documents.find((d) => d.id === id && d.profileId === profileId);
  if (!found) throw new AppError('not_found', 'This document no longer exists.');
  return found;
}

// shortcut: no version check on edit/delete (Phase 2 backend adds it), upgrade with Supabase.
export const demoDocumentRepository: DocumentRepository = {
  async list(profileId) {
    await demoRequest('read');
    checkAccess(profileId);
    return documents
      .filter((d) => d.profileId === profileId)
      .sort((a, b) => b.relevantDate.localeCompare(a.relevantDate))
      .map((d) => ({ ...d }));
  },

  async create(profileId, details, file) {
    await demoRequest('write');
    checkAccess(profileId);
    const time = nowIso();
    const created: MedicalDocument = { ...details, ...file, id: newDemoId('document'), version: 1, createdAt: time, updatedAt: time, profileId };
    documents.push(created);
    return { ...created };
  },

  async updateDetails(profileId, id, details) {
    await demoRequest('write');
    checkAccess(profileId);
    const existing = findOwn(profileId, id);
    Object.assign(existing, details, { version: existing.version + 1, updatedAt: nowIso() });
    return { ...existing };
  },

  async remove(profileId, id) {
    await demoRequest('write');
    checkAccess(profileId);
    findOwn(profileId, id);
    removeWhere(documents, (d) => d.id === id);
  },
};
