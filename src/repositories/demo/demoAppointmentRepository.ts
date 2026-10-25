// DEMONSTRATION DATA — see demoDatabase.ts.
import type { Appointment } from '../../models/Appointment';
import { AppError } from '../../models/errors';
import type { AppointmentRepository } from '../appointmentRepository';
import { demoRequest, findAccessibleProfile, newDemoId, nowIso, removeWhere, requireDemoAccount } from './demoDatabase';

const SEED_TIME = '2026-10-01T09:00:00.000Z';

const appointments: Appointment[] = [
  {
    id: 'demo-appointment-1',
    version: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    profileId: 'demo-profile-father',
    doctorName: 'Dr. Demo Cardiologist',
    startsAt: '2026-11-03T10:30:00.000Z',
    location: 'Demo Clinic, Cairo',
    notes: 'Bring the latest blood test results.',
    status: 'scheduled',
  },
  {
    id: 'demo-appointment-2',
    version: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    profileId: 'demo-profile-father',
    doctorName: 'Dr. Demo Diabetes Specialist',
    startsAt: '2026-10-10T09:00:00.000Z',
    location: null,
    notes: null,
    status: 'completed',
  },
];

// Checks the caller may use the profile, like row-level security would.
function checkAccess(profileId: string) {
  findAccessibleProfile(profileId, requireDemoAccount().id);
}

function findOwn(profileId: string, id: string): Appointment {
  const found = appointments.find((a) => a.id === id && a.profileId === profileId);
  if (!found) throw new AppError('not_found', 'This appointment no longer exists.');
  return found;
}

// shortcut: no version check on edit/delete (Phase 2 backend adds it), upgrade with Supabase.
export const demoAppointmentRepository: AppointmentRepository = {
  async list(profileId) {
    await demoRequest('read');
    checkAccess(profileId);
    return appointments
      .filter((a) => a.profileId === profileId)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((a) => ({ ...a }));
  },

  async create(profileId, input) {
    await demoRequest('write');
    checkAccess(profileId);
    const time = nowIso();
    const created: Appointment = { ...input, id: newDemoId('appointment'), version: 1, createdAt: time, updatedAt: time, profileId };
    appointments.push(created);
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
    removeWhere(appointments, (a) => a.id === id);
  },
};
