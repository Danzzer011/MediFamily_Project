import type { IsoDate, RecordMeta } from './common';

export const DOCUMENT_CATEGORIES = ['prescription', 'lab_report', 'scan', 'other'] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/**
 * A medical document (FR07): an image or PDF with its descriptive details.
 * Prescription attachments (FR04) are stored once as documents like this and linked
 * to the prescription, so deleting the prescription keeps the document.
 */
export type MedicalDocument = RecordMeta & {
  profileId: string;
  title: string;
  category: DocumentCategory;
  relevantDate: IsoDate;
  /** Where the file is stored (a private storage path in Phase 2; a local file address in the demo). */
  storagePath: string;
  originalFileName: string;
  mimeType: string;
};

/** A file the user just took with the camera or chose, before it is uploaded. */
export type PickedFile = {
  uri: string;
  fileName: string;
  mimeType: string;
};

export function isPdf(file: { mimeType: string }): boolean {
  return file.mimeType === 'application/pdf';
}
