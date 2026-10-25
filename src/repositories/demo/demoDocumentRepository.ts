// DEMONSTRATION DATA — see demoDatabase.ts.
import { AppError } from '../../models/errors';
import type { MedicalDocument } from '../../models/MedicalDocument';
import type { DocumentRepository } from '../documentRepository';
import { demoRequest, findAccessibleProfile, newDemoId, nowIso, removeWhere, requireDemoAccount } from './demoDatabase';

const SEED_TIME = '2026-10-01T09:00:00.000Z';

// Made-up documents for the demo profile. No real file is stored, only a name and a type.
function demo(n: number, title: string, category: MedicalDocument['category'], relevantDate: string, fileName: string, fileType: MedicalDocument['fileType']): MedicalDocument {
  return { id: `demo-document-${n}`, version: 1, createdAt: SEED_TIME, updatedAt: SEED_TIME, profileId: 'demo-profile-father', title, category, relevantDate, fileName, fileType };
}

const documents: MedicalDocument[] = [
  demo(1, 'Prescription: Concor 5 mg, Glucophage 500 mg', 'prescription', '2026-10-12', 'IMG_2041.jpg', 'image'),
  demo(2, 'Blood test results: HbA1c and lipids', 'lab report', '2026-09-28', 'blood-test-sep-2026.pdf', 'pdf'),
  demo(3, 'Chest X-ray', 'scan', '2026-08-15', 'chest-xray.jpg', 'image'),
  demo(4, 'Discharge report, Al Salam International Hospital, Maadi', 'other', '2026-03-03', 'discharge-report.pdf', 'pdf'),
  demo(5, 'Eye pressure results', 'lab report', '2026-01-19', 'eye-pressure-jan.pdf', 'pdf'),
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

// No version check on edit or delete yet. The Phase 2 backend adds it.
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
