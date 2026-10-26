import type { Measurement, MeasurementInput } from '../models/Measurement';
import { demoMeasurementRepository } from './demo/demoMeasurementRepository';

/** Health measurements of one profile (FR08). The caller must have access to the profile. */
export type MeasurementRepository = {
  /** Newest first. */
  list(profileId: string): Promise<Measurement[]>;
  create(profileId: string, input: MeasurementInput): Promise<Measurement>;
  update(profileId: string, id: string, input: MeasurementInput): Promise<Measurement>;
  remove(profileId: string, id: string): Promise<void>;
};

// Phase 1: demonstration data. Replace with the Supabase adapter in Phase 2.
export const measurementRepository: MeasurementRepository = demoMeasurementRepository;
