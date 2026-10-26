// DEMONSTRATION DATA — see demoDatabase.ts.
import type { Appointment } from '../../models/Appointment';
import { AppError } from '../../models/errors';
import type { AppointmentRepository } from '../appointmentRepository';
import { demoRequest, findAccessibleProfile, newDemoId, nowIso, removeWhere, requireDemoAccount } from './demoDatabase';

const SEED_TIME = '2026-10-01T09:00:00.000Z';

// Made-up visits for the demo profile (Cairo time: UTC+2 in winter, UTC+3 in summer).
function demo(n: number, startsAt: string, doctorName: string, location: string | null, notes: string | null, status: Appointment['status']): Appointment {
  return { id: `demo-appointment-${n}`, version: 1, createdAt: SEED_TIME, updatedAt: SEED_TIME, profileId: 'demo-profile-father', doctorName, startsAt, location, notes, status };
}

const appointments: Appointment[] = [
  demo(1, '2026-11-05T16:30:00.000Z', 'Dr. Hany Fawzy', 'Al Salam International Hospital, Maadi', 'Bring the last ECG and the October blood test.', 'scheduled'),
  demo(2, '2026-11-09T09:00:00.000Z', 'Dr. Mohamed Abdel Moneim El-Gendy', 'Dar Al Fouad Hospital, 6th of October City', 'Fasting. No breakfast before the HbA1c test.', 'scheduled'),
  demo(3, '2026-10-20T14:00:00.000Z', 'Dr. Tarek Nabil', 'Heliopolis Eye Clinic', null, 'missed'),
  demo(4, '2026-10-12T15:30:00.000Z', 'Dr. Hany Fawzy', 'Al Salam International Hospital, Maadi', 'Panadol 500 mg only if needed. Follow-up in 4 weeks.', 'completed'),
  demo(5, '2026-10-04T10:15:00.000Z', 'Dr. Nadia El-Sayed', null, 'Clinic cancelled. Needs a new date.', 'cancelled'),
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

// No version check on edit or delete yet. The Phase 2 backend adds it.
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
