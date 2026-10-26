// DEMONSTRATION DATA — see demoDatabase.ts.
import { AppError } from '../../models/errors';
import type { Measurement } from '../../models/Measurement';
import type { MeasurementRepository } from '../measurementRepository';
import { demoRequest, findAccessibleProfile, newDemoId, nowIso, removeWhere, requireDemoAccount } from './demoDatabase';

const SEED_TIME = '2026-10-01T09:00:00.000Z';

// Made-up readings for the demo profile (Cairo time is UTC+3 until 29 Oct 2026).
function demo(n: number, measuredAt: string, type: Measurement['type'], value: number, diastolic: number | null, unit: Measurement['unit']): Measurement {
  return { id: `demo-measurement-${n}`, version: 1, createdAt: SEED_TIME, updatedAt: SEED_TIME, profileId: 'demo-profile-father', type, measuredAt, value, diastolic, unit };
}

const measurements: Measurement[] = [
  demo(1, '2026-10-25T04:30:00.000Z', 'blood pressure', 130, 85, 'mmHg'),
  demo(2, '2026-10-24T18:10:00.000Z', 'blood glucose', 142, null, 'mg/dL'),
  demo(3, '2026-10-24T04:30:00.000Z', 'blood pressure', 128, 82, 'mmHg'),
  demo(4, '2026-10-23T04:05:00.000Z', 'weight', 82.4, null, 'kg'),
  demo(5, '2026-10-22T03:50:00.000Z', 'blood glucose', 6.1, null, 'mmol/L'),
  // a few earlier readings, so the demo chart has a line to draw
  demo(6, '2026-10-23T04:40:00.000Z', 'blood pressure', 131, 84, 'mmHg'),
  demo(7, '2026-10-22T04:35:00.000Z', 'blood pressure', 126, 80, 'mmHg'),
  demo(8, '2026-10-21T04:30:00.000Z', 'blood pressure', 134, 88, 'mmHg'),
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

// No version check on edit or delete yet. The Phase 2 backend adds it.
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
