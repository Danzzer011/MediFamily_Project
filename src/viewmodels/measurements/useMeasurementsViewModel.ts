import { useEffect, useState } from 'react';

import { splitTimestamp, toTimestamp, validateDateTime } from '../../models/dateTime';
import { toAppError } from '../../models/errors';
import type { FamilyProfile } from '../../models/FamilyProfile';
import { UNITS_BY_TYPE, type Measurement, type MeasurementType, type MeasurementUnit } from '../../models/Measurement';
import { measurementRepository } from '../../repositories/measurementRepository';
import { profileRepository } from '../../repositories/profileRepository';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// null = showing the list, 'new' = adding, otherwise the measurement being edited.
type Editing = null | 'new' | Measurement;
type FormErrors = { value: string; diastolic: string; date: string; time: string };
const NO_ERRORS: FormErrors = { value: '', diastolic: '', date: '', time: '' };

// "72,5" or "72.5" -> 72.5. Returns null unless it is a number above zero.
function parsePositive(text: string): number | null {
  const number = Number(text.trim().replace(',', '.'));
  return text.trim() && Number.isFinite(number) && number > 0 ? number : null;
}

// ViewModel for the Health Measurements page (FR08): list with a type filter, add, edit and delete.
// It only stores and shows the numbers: no diagnosis, no warnings, no daily-entry rule.
export function useMeasurementsViewModel(profileId: string) {
  const { reloadKey, reload } = useReloadOnFocus();

  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<'all' | MeasurementType>('all');

  // form state
  const [editing, setEditing] = useState<Editing>(null);
  const [type, setType] = useState<MeasurementType>('blood pressure');
  const [unit, setUnit] = useState<MeasurementUnit>('mmHg');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [value, setValue] = useState(''); // systolic for blood pressure
  const [diastolic, setDiastolic] = useState('');
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // delete confirmation
  const [pendingDelete, setPendingDelete] = useState<Measurement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    Promise.all([profileRepository.getProfile(profileId), measurementRepository.list(profileId)])
      .then(([loadedProfile, loadedList]) => {
        if (!active) return;
        setLoadError('');
        setProfile(loadedProfile);
        setMeasurements(loadedList);
      })
      .catch((error) => {
        if (!active) return;
        setProfile(null);
        setLoadError(toAppError(error).message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId, reloadKey]);

  const visible = filter === 'all' ? measurements : measurements.filter((m) => m.type === filter);

  // picking a type also picks that type's default unit
  function changeType(next: MeasurementType) {
    setType(next);
    setUnit(UNITS_BY_TYPE[next][0]);
    setErrors(NO_ERRORS);
  }

  // times are entered and shown in the profile's time zone, so every caregiver sees the same schedule
  const zone = profile?.timeZone ?? 'UTC';

  function startAdding() {
    setEditing('new');
    changeType(filter === 'all' ? 'blood pressure' : filter);
    setDate(splitTimestamp(new Date().toISOString(), zone).date);
    setTime('08:00');
    setValue('');
    setDiastolic('');
    setFormError('');
  }

  function startEditing(measurement: Measurement) {
    const parts = splitTimestamp(measurement.measuredAt, zone);
    setEditing(measurement);
    setType(measurement.type);
    setUnit(measurement.unit);
    setDate(parts.date);
    setTime(parts.time);
    setValue(String(measurement.value));
    setDiastolic(measurement.diastolic === null ? '' : String(measurement.diastolic));
    setErrors(NO_ERRORS);
    setFormError('');
  }

  function cancelEditing() {
    setEditing(null);
  }

  async function save() {
    if (saving || !editing) return;
    const isPressure = type === 'blood pressure';
    const first = parsePositive(value);
    const second = parsePositive(diastolic);
    const dateTime = validateDateTime(date, time);
    const next: FormErrors = {
      value: first === null ? (isPressure ? 'Enter the top number, like 130.' : 'Enter a number above zero.') : '',
      diastolic: isPressure && second === null ? 'Enter the bottom number, like 85.' : '',
      date: dateTime.date ?? '',
      time: dateTime.time ?? '',
    };
    setErrors(next);
    if (next.value || next.diastolic || next.date || next.time || first === null) return;

    const input = {
      type,
      measuredAt: toTimestamp(date, time, zone),
      value: first,
      diastolic: isPressure ? second : null,
      unit,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing === 'new') await measurementRepository.create(profileId, input);
      else await measurementRepository.update(profileId, editing.id, input);
      if (filter !== 'all' && filter !== type) setFilter('all'); // otherwise the saved reading would be hidden
      setEditing(null);
      reload();
    } catch (error) {
      setFormError(toAppError(error).message);
    }
    setSaving(false);
  }

  function askToDelete(measurement: Measurement) {
    setDeleteError('');
    setPendingDelete(measurement);
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await measurementRepository.remove(profileId, pendingDelete.id);
      setPendingDelete(null);
      setEditing(null); // the edit form belonged to the deleted reading
      reload();
    } catch (error) {
      setDeleteError(toAppError(error).message);
    }
    setDeleting(false);
  }

  return {
    profile,
    visible,
    total: measurements.length,
    loading,
    loadError,
    zone,
    filter,
    setFilter,
    editing,
    isNew: editing === 'new',
    type,
    unit,
    date,
    time,
    value,
    diastolic,
    errors,
    formError,
    saving,
    changeType,
    setUnit,
    setDate,
    setTime,
    setValue,
    setDiastolic,
    startAdding,
    startEditing,
    cancelEditing,
    save,
    pendingDelete,
    deleting,
    deleteError,
    askToDelete,
    cancelDelete,
    confirmDelete,
  };
}
