import { useEffect, useState } from 'react';

import { toAppError } from '../../models/errors';
import { stockOf, type Medication, type MedicationStock } from '../../models/Medication';
import { validateStockAmount, validateStockUnit } from '../../models/validation';
import { medicationRepository } from '../../repositories/medicationRepository';

// "12.50" -> "12.5", 3 -> "3": how an amount is shown in the form.
function amountText(amount: number): string {
  return String(Number(amount.toFixed(2)));
}

// ViewModel for updating one medication's stock by hand (FR06):
// remaining quantity, unit and refill threshold, or stop tracking it.
export function useStockFormViewModel(medicationId: string) {
  const [medication, setMedication] = useState<Medication | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('tablets');
  const [threshold, setThreshold] = useState('');

  const [quantityError, setQuantityError] = useState('');
  const [unitError, setUnitError] = useState('');
  const [thresholdError, setThresholdError] = useState('');
  const [formError, setFormError] = useState('');
  const [staleRecord, setStaleRecord] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [confirmingStop, setConfirmingStop] = useState(false);

  // fill the form with the saved stock
  useEffect(() => {
    let active = true;
    medicationRepository
      .getMedication(medicationId)
      .then((loaded) => {
        if (!active) return;
        const stock = stockOf(loaded);
        setLoadError('');
        setMedication(loaded);
        setQuantity(stock ? amountText(stock.remainingQuantity) : '');
        setUnit(stock ? stock.stockUnit : 'tablets');
        setThreshold(stock ? amountText(stock.refillThreshold) : '');
        setStaleRecord(false);
        setFormError('');
      })
      .catch((error) => active && setLoadError(toAppError(error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [medicationId, reloadCount]);

  function changeQuantity(text: string) {
    setQuantity(text);
    setQuantityError('');
    setFormError('');
  }

  function changeUnit(text: string) {
    setUnit(text);
    setUnitError('');
    setFormError('');
  }

  function changeThreshold(text: string) {
    setThreshold(text);
    setThresholdError('');
    setFormError('');
  }

  // the +1 / -1 buttons: quick manual corrections, never below zero
  function adjustQuantity(change: number) {
    const current = validateStockAmount(quantity, 'quantity') ? 0 : Number(quantity);
    changeQuantity(amountText(Math.max(0, current + change)));
  }

  // throws away unsaved changes and loads the latest saved version
  function reloadLatest() {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  async function saveStock(stock: MedicationStock | null): Promise<boolean> {
    if (!medication) return false;
    setSaving(true);
    try {
      const saved = await medicationRepository.updateStock(medication.id, medication.version, stock);
      setMedication(saved);
      setSaving(false);
      return true;
    } catch (error) {
      const appError = toAppError(error);
      setFormError(appError.message);
      setStaleRecord(appError.code === 'stale_record');
      setSaving(false);
      return false;
    }
  }

  // returns true when saved
  async function save(): Promise<boolean> {
    if (saving) return false;
    const quantityProblem = validateStockAmount(quantity, 'remaining quantity') ?? '';
    const unitProblem = validateStockUnit(unit) ?? '';
    const thresholdProblem = validateStockAmount(threshold, 'refill threshold') ?? '';
    setQuantityError(quantityProblem);
    setUnitError(unitProblem);
    setThresholdError(thresholdProblem);
    setFormError('');
    if (quantityProblem || unitProblem || thresholdProblem) return false;

    return saveStock({
      remainingQuantity: Number(quantity.trim()),
      stockUnit: unit.trim(),
      refillThreshold: Number(threshold.trim()),
    });
  }

  function askToStopTracking() {
    setFormError('');
    setConfirmingStop(true);
  }

  function cancelStopTracking() {
    setConfirmingStop(false);
  }

  // clears all three stock fields: "not tracked", which is not the same as zero stock
  async function confirmStopTracking(): Promise<boolean> {
    if (saving) return false;
    const stopped = await saveStock(null);
    setConfirmingStop(false);
    return stopped;
  }

  const quantityNumber = validateStockAmount(quantity, 'quantity') ? null : Number(quantity);
  const thresholdNumber = validateStockAmount(threshold, 'threshold') ? null : Number(threshold);
  // live preview of the alert while typing; the list page uses the saved values
  const wouldNeedRefill = quantityNumber !== null && thresholdNumber !== null && quantityNumber <= thresholdNumber;

  return {
    medication,
    isTracked: medication !== null && stockOf(medication) !== null,
    quantity,
    unit,
    threshold,
    quantityError,
    unitError,
    thresholdError,
    formError,
    staleRecord,
    loading,
    loadError,
    saving,
    confirmingStop,
    wouldNeedRefill,
    changeQuantity,
    changeUnit,
    changeThreshold,
    adjustQuantity,
    reloadLatest,
    save,
    askToStopTracking,
    cancelStopTracking,
    confirmStopTracking,
  };
}
