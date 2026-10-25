/**
 * Error kinds that every ViewModel should be able to show to the user.
 * Repositories throw `AppError`; ViewModels read `code` to decide what to do
 * (e.g. offer a reload on `stale_record`).
 */
export type AppErrorCode =
  /** The record changed or was deleted since it was opened; reload required. */
  | 'stale_record'
  /** Internet access is required for this change. */
  | 'offline'
  /** The signed-in account is not allowed to do this (or no longer has access). */
  | 'not_allowed'
  | 'not_found'
  /** Input rejected by a domain rule or the backend. */
  | 'validation'
  /** Sign-in, registration or session failure. */
  | 'auth'
  | 'unknown';

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  stale_record: 'This record was changed or deleted by someone else. Reload to see the latest version.',
  offline: 'An internet connection is required to save changes.',
  not_allowed: 'You are not allowed to do this.',
  not_found: 'This item no longer exists.',
  validation: 'Please check the highlighted information.',
  auth: 'Sign-in failed. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message?: string) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = 'AppError';
    this.code = code;
  }
}

/** Normalises anything thrown into an `AppError` for display. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError('unknown');
}
