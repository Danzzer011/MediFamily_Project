import type { IsoDate, RecordMeta } from './common';
import { todayIsoDate } from './dates';

/** A daily clock time, formatted HH:mm (24-hour), in the profile's time zone. */
export type DailyTime = string;

/**
 * A medication schedule (FR03) for one profile.
 * The stock fields (FR06) live on the same row: either all three are set,
 * or all three are null ("not tracked") — null never means zero stock.
 */
export type Medication = RecordMeta & {
  profileId: string;
  name: string;
  dosageInstructions: string;
  /** At least one, no duplicates, sorted earliest first. */
  reminderTimes: DailyTime[];
  treatmentStart: IsoDate;
  /** null means no scheduled end: reminders continue until the medication is removed. */
  treatmentEnd: IsoDate | null;
  remainingQuantity: number | null;
  stockUnit: string | null;
  refillThreshold: number | null;
};

/** Schedule fields that authorised users create and edit (FR03). */
export type MedicationInput = {
  name: string;
  dosageInstructions: string;
  reminderTimes: DailyTime[];
  treatmentStart: IsoDate;
  treatmentEnd: IsoDate | null;
};

export type TreatmentStatus = 'not_started' | 'active' | 'ended';

// Where today falls in the treatment period. Reminders only happen while it is 'active' (FR03).
export function treatmentStatus(medication: Pick<Medication, 'treatmentStart' | 'treatmentEnd'>, today: IsoDate = todayIsoDate()): TreatmentStatus {
  if (today < medication.treatmentStart) return 'not_started';
  if (medication.treatmentEnd !== null && today > medication.treatmentEnd) return 'ended';
  return 'active';
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toLocalIsoDate(date: Date): IsoDate {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The reminder instants for the next `days` days, starting after `now`, that fall
 * inside the treatment period (FR03). Times are read in this device's time zone.
 * Phones limit how many notifications can wait at once, so reminders are scheduled
 * a few days ahead and topped up each time the medication list loads.
 */
export function upcomingReminderInstants(
  medication: Pick<Medication, 'reminderTimes' | 'treatmentStart' | 'treatmentEnd'>,
  now: Date,
  days: number,
): Date[] {
  const instants: Date[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(now.getTime() + offset * MS_PER_DAY);
    const isoDay = toLocalIsoDate(day);
    if (treatmentStatus(medication, isoDay) !== 'active') continue;
    for (const time of medication.reminderTimes) {
      const [hours, minutes] = time.split(':').map(Number);
      const instant = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
      if (instant > now) instants.push(instant);
    }
  }
  return instants.sort((a, b) => a.getTime() - b.getTime());
}

/** Stock details (FR06), entered and updated by hand. `null` means stock is not tracked. */
export type MedicationStock = {
  remainingQuantity: number;
  stockUnit: string;
  refillThreshold: number;
};

export const COMMON_STOCK_UNITS = ['tablets', 'capsules', 'mL', 'doses'] as const;

// The saved stock, or null when this medication's stock is not tracked.
export function stockOf(medication: Medication): MedicationStock | null {
  if (medication.remainingQuantity === null || medication.stockUnit === null || medication.refillThreshold === null) {
    return null;
  }
  return {
    remainingQuantity: medication.remainingQuantity,
    stockUnit: medication.stockUnit,
    refillThreshold: medication.refillThreshold,
  };
}

// FR06: the in-app refill alert shows while the quantity is at or below the threshold,
// and clears as soon as it rises above it. Untracked stock never shows an alert.
export function needsRefill(medication: Medication): boolean {
  const stock = stockOf(medication);
  return stock !== null && stock.remainingQuantity <= stock.refillThreshold;
}
