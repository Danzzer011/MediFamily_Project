import type { MedicalDocument, PickedFile } from '../models/MedicalDocument';
import { demoDocumentRepository } from './demo/demoDocumentRepository';

/** The details a user can edit later (FR07). The file itself never changes. */
export type DocumentDetails = Pick<MedicalDocument, 'title' | 'category' | 'relevantDate'>;

/** Medical documents of one profile (FR07). The caller must have access to the profile. */
export type DocumentRepository = {
  /** Newest relevant date first. Includes the attachments of prescriptions. */
  list(profileId: string): Promise<MedicalDocument[]>;
  create(profileId: string, details: DocumentDetails, file: PickedFile): Promise<MedicalDocument>;
  /** Details only: the file is never replaced. */
  updateDetails(profileId: string, id: string, details: DocumentDetails): Promise<MedicalDocument>;
  /** Also unlinks the document from any prescription. The prescription's written details stay (FR07). */
  remove(profileId: string, id: string): Promise<void>;
};

// Phase 1: demonstration data. Replace with the Supabase adapter in Phase 2.
export const documentRepository: DocumentRepository = demoDocumentRepository;
