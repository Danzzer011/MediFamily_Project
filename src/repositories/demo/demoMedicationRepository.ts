// DEMONSTRATION DATA — see demoDatabase.ts.
import { AppError } from '../../models/errors';
import type { Medication, MedicationInput, MedicationStock } from '../../models/Medication';
import {
  validateDosageInstructions,
  validateMedicationName,
  validateReminderTime,
  validateStockUnit,
  validateTreatmentEnd,
  validateTreatmentStart,
} from '../../models/validation';
import type { MedicationRepository } from '../medicationRepository';
import {
  demoRequest,
  demoTables,
  findAccessibleProfile,
  newDemoId,
  nowIso,
  removeWhere,
  requireDemoAccount,
} from './demoDatabase';

// The backend checks the same rules as the form (database constraints in Phase 2).
function checkInput(input: MedicationInput): void {
  const problem =
    validateMedicationName(input.name) ??
    validateDosageInstructions(input.dosageInstructions) ??
    validateTreatmentStart(input.treatmentStart) ??
    validateTreatmentEnd(input.treatmentStart, input.treatmentEnd ?? '');
  if (problem) throw new AppError('validation', problem);
  if (input.reminderTimes.length === 0) {
    throw new AppError('validation', 'Add at least one daily reminder time.');
  }
  if (input.reminderTimes.some((time) => validateReminderTime(time) !== null)) {
    throw new AppError('validation', 'Every reminder time must be written as HH:mm.');
  }
  if (new Set(input.reminderTimes).size !== input.reminderTimes.length) {
    throw new AppError('validation', 'Each reminder time can only be added once.');
  }
}

// FR06: tracked stock has all three fields, with amounts of zero or more.
function checkStock(stock: MedicationStock): void {
  const unitProblem = validateStockUnit(stock.stockUnit);
  if (unitProblem) throw new AppError('validation', unitProblem);
  if (!(stock.remainingQuantity >= 0) || !(stock.refillThreshold >= 0)) {
    throw new AppError('validation', 'The quantity and refill threshold must be 0 or more.');
  }
}

function copyMedication(medication: Medication): Medication {
  return { ...medication, reminderTimes: [...medication.reminderTimes] };
}

function scheduleFields(input: MedicationInput) {
  return {
    name: input.name.trim(),
    dosageInstructions: input.dosageInstructions.trim(),
    reminderTimes: [...input.reminderTimes].sort(),
    treatmentStart: input.treatmentStart,
    treatmentEnd: input.treatmentEnd,
  };
}

/**
 * Finds a medication for a versioned change, as the backend's atomic version check would.
 * A missing medication is reported as stale: someone else deleted it after it was opened.
 */
function findCurrentMedication(medicationId: string, expectedVersion: number): Medication {
  const account = requireDemoAccount();
  const medication = demoTables.medications.find((m) => m.id === medicationId);
  if (!medication) throw new AppError('stale_record');
  findAccessibleProfile(medication.profileId, account.id);
  if (medication.version !== expectedVersion) throw new AppError('stale_record');
  return medication;
}

export const demoMedicationRepository: MedicationRepository = {
  async listMedications(profileId) {
    await demoRequest('read');
    const account = requireDemoAccount();
    findAccessibleProfile(profileId, account.id);
    return demoTables.medications
      .filter((m) => m.profileId === profileId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(copyMedication);
  },

  async getMedication(medicationId) {
    await demoRequest('read');
    const account = requireDemoAccount();
    const medication = demoTables.medications.find((m) => m.id === medicationId);
    if (!medication) throw new AppError('not_found');
    findAccessibleProfile(medication.profileId, account.id);
    return copyMedication(medication);
  },

  async createMedication(profileId, input) {
    await demoRequest('write');
    const account = requireDemoAccount();
    findAccessibleProfile(profileId, account.id);
    checkInput(input);
    const time = nowIso();
    const medication: Medication = {
      id: newDemoId('medication'),
      version: 1,
      createdAt: time,
      updatedAt: time,
      profileId,
      ...scheduleFields(input),
      remainingQuantity: null,
      stockUnit: null,
      refillThreshold: null,
    };
    demoTables.medications.push(medication);
    return copyMedication(medication);
  },

  async updateMedication(medicationId, expectedVersion, input) {
    await demoRequest('write');
    checkInput(input);
    const medication = findCurrentMedication(medicationId, expectedVersion);
    Object.assign(medication, scheduleFields(input), { version: medication.version + 1, updatedAt: nowIso() });
    return copyMedication(medication);
  },

  async deleteMedication(medicationId, expectedVersion) {
    await demoRequest('write');
    findCurrentMedication(medicationId, expectedVersion);
    removeWhere(demoTables.medications, (m) => m.id === medicationId);
    // prescriptions keep the written medicine; only the link is cleared, which changes their version
    for (const prescription of demoTables.prescriptions) {
      const linked = prescription.medicines.filter((item) => item.medicationId === medicationId);
      if (linked.length === 0) continue;
      linked.forEach((item) => (item.medicationId = null));
      prescription.version += 1;
      prescription.updatedAt = nowIso();
    }
  },

  async updateStock(medicationId, expectedVersion, stock) {
    await demoRequest('write');
    if (stock) checkStock(stock);
    const medication = findCurrentMedication(medicationId, expectedVersion);
    Object.assign(medication, {
      remainingQuantity: stock?.remainingQuantity ?? null,
      stockUnit: stock ? stock.stockUnit.trim() : null,
      refillThreshold: stock?.refillThreshold ?? null,
      version: medication.version + 1,
      updatedAt: nowIso(),
    });
    return copyMedication(medication);
  },
};
