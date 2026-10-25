/** Calendar date without a time of day, formatted YYYY-MM-DD. */
export type IsoDate = string;

/** An instant in time, formatted as an ISO 8601 timestamp. */
export type IsoTimestamp = string;

/**
 * Fields shared by every versioned cloud record (data-storage plan §2).
 * `version` starts at 1 and the backend increments it on every change;
 * edits and deletions must send the version that was loaded.
 */
export type RecordMeta = {
  id: string;
  version: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};
