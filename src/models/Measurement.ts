import type { IsoTimestamp, RecordMeta } from './common';

export const MEASUREMENT_TYPES = ['blood pressure', 'blood glucose', 'weight'] as const;
export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

export type MeasurementUnit = 'mmHg' | 'mg/dL' | 'mmol/L' | 'kg' | 'lb';

/** The units the user can pick for each type. The first one is the default. */
export const UNITS_BY_TYPE: Record<MeasurementType, readonly MeasurementUnit[]> = {
  'blood pressure': ['mmHg'],
  'blood glucose': ['mg/dL', 'mmol/L'],
  weight: ['kg', 'lb'],
};

/** What the user types in the measurement form (FR08). */
export type MeasurementInput = {
  type: MeasurementType;
  measuredAt: IsoTimestamp;
  /** The reading. For blood pressure this is the systolic (top) number. */
  value: number;
  /** Only for blood pressure: the diastolic (bottom) number. Otherwise null. */
  diastolic: number | null;
  /** Saved with every reading and always shown next to it. */
  unit: MeasurementUnit;
};

export type Measurement = RecordMeta & MeasurementInput & { profileId: string };

// "120/80 mmHg" or "95 mg/dL". Only shows the saved numbers: no diagnosis, no warnings.
export function formatReading(m: Pick<MeasurementInput, 'type' | 'value' | 'diastolic' | 'unit'>): string {
  return m.type === 'blood pressure' ? `${m.value}/${m.diastolic} ${m.unit}` : `${m.value} ${m.unit}`;
}
