// DEMONSTRATION DATA — see demoDatabase.ts.
import { AppError } from '../../models/errors';
import type { Measurement } from '../../models/Measurement';
import type { MeasurementRepository } from '../measurementRepository';
import { demoRequest, findAccessibleProfile, newDemoId, nowIso, removeWhere, requireDemoAccount } from './demoDatabase';

const SEED_TIME = '2026-10-01T09:00:00.000Z';

const measurements: Measurement[] = [
  { id: 'demo-measurement-1', version: 1, createdAt: SEED_TIME, updatedAt: SEED_TIME, profileId: 'demo-profile-father', type: 'blood pressure', measuredAt: '2026-10-20T07:30:00.000Z', value: 128, diastolic: 82, unit: 'mmHg' },
  { id: 'demo-measurement-2', version: 1, createdAt: SEED_TIME, updatedAt: SEED_TIME, profileId: 'demo-profile-father', type: 'blood glucose', measuredAt: '2026-10-19T06:45:00.000Z', value: 105, diastolic: null, unit: 'mg/dL' },
  { id: 'demo-measurement-3', version: 1, createdAt: SEED_TIME, updatedAt: SEED_TIME, profileId: 'demo-profile-father', type: 'weight', measuredAt: '2026-10-18T08:00:00.000Z', value: 78.5, diastolic: null, unit: 'kg' },
];

// Checks the caller may use the profile, like row-level security would.
function checkAccess(profileId: string) {
  findAccessibleProfile(profileId, requireDemoAccount().id);
}

function findOwn(profileId: string, id: string): Measurement {
  const found = measurements.find((m) => m.id === id && m.profileId === profileId);
  if (!found) throw new AppError('not_found', 'This measurement no longer exists.');
  return found;
}

// shortcut: no version check on edit/delete (Phase 2 backend adds it), upgrade with Supabase.
export const demoMeasurementRepository: MeasurementRepository = {
  async list(profileId) {
    await demoRequest('read');
    checkAccess(profileId);
    return measurements
      .filter((m) => m.profileId === profileId)
      .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
      .map((m) => ({ ...m }));
  },

  async create(profileId, input) {
    await demoRequest('write');
    checkAccess(profileId);
    const time = nowIso();
    const created: Measurement = { ...input, id: newDemoId('measurement'), version: 1, createdAt: time, updatedAt: time, profileId };
    measurements.push(created);
    return { ...created };
  },

  async update(profileId, id, input) {
    await demoRequest('write');
    checkAccess(profileId);
    const existing = findOwn(profileId, id);
    Object.assign(existing, input, { version: existing.version + 1, updatedAt: nowIso() });
    return { ...existing };
  },

  async remove(profileId, id) {
    await demoRequest('write');
    checkAccess(profileId);
    findOwn(profileId, id);
    removeWhere(measurements, (m) => m.id === id);
  },
};
