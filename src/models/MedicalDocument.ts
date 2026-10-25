import type { IsoDate, RecordMeta } from './common';

export const DOCUMENT_CATEGORIES = ['prescription', 'lab report', 'scan', 'other'] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export type DocumentFileType = 'image' | 'pdf';

/** The details the user can edit later (FR07). */
export type DocumentDetails = {
  title: string;
  category: DocumentCategory;
  relevantDate: IsoDate;
};

/** The attached file. Chosen once when adding; editing never replaces it. */
export type DocumentFile = {
  fileName: string;
  fileType: DocumentFileType;
};

export type MedicalDocument = RecordMeta & DocumentDetails & DocumentFile & { profileId: string };
