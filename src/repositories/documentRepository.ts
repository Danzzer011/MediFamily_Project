import type { DocumentDetails, DocumentFile, MedicalDocument } from '../models/MedicalDocument';
import { demoDocumentRepository } from './demo/demoDocumentRepository';

/** Medical documents of one profile (FR07). The caller must have access to the profile. */
export type DocumentRepository = {
  /** Newest relevant date first. */
  list(profileId: string): Promise<MedicalDocument[]>;
  create(profileId: string, details: DocumentDetails, file: DocumentFile): Promise<MedicalDocument>;
  /** Details only: the file itself is never replaced. */
  updateDetails(profileId: string, id: string, details: DocumentDetails): Promise<MedicalDocument>;
  remove(profileId: string, id: string): Promise<void>;
};

// Phase 1: demonstration data. Replace with the Supabase adapter in Phase 2.
export const documentRepository: DocumentRepository = demoDocumentRepository;
