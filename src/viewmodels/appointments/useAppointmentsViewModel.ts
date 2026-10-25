import { useEffect, useState } from 'react';

import type { Appointment, AppointmentStatus } from '../../models/Appointment';
import { splitTimestamp, toTimestamp, validateDateTime } from '../../models/dateTime';
import { toAppError } from '../../models/errors';
import type { FamilyProfile } from '../../models/FamilyProfile';
import { toOptionalText } from '../../models/validation';
import { appointmentRepository } from '../../repositories/appointmentRepository';
import { profileRepository } from '../../repositories/profileRepository';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// null = showing the list, 'new' = adding, otherwise the appointment being edited.
type Editing = null | 'new' | Appointment;
type FormErrors = { doctor: string; date: string; time: string };
const NO_ERRORS: FormErrors = { doctor: '', date: '', time: '' };

// ViewModel for the Appointments page (FR05): list, add, edit and delete for the selected profile.
export function useAppointmentsViewModel(profileId: string) {
  const { reloadKey, reload } = useReloadOnFocus();

  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // UI only for now: the real per-phone reminder setting comes in Phase 2.
  const [remindersOn, setRemindersOn] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // form state
  const [editing, setEditing] = useState<Editing>(null);
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // delete confirmation
  const [pendingDelete, setPendingDelete] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    Promise.all([profileRepository.getProfile(profileId), appointmentRepository.list(profileId)])
      .then(([loadedProfile, loadedList]) => {
        if (!active) return;
        setLoadError('');
        setProfile(loadedProfile);
        setAppointments(loadedList);
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

  // times are entered and shown in the profile's time zone, so every caregiver sees the same schedule
  const zone = profile?.timeZone ?? 'UTC';

  function startAdding() {
    setEditing('new');
    setDoctor('');
    setDate(splitTimestamp(new Date().toISOString(), zone).date);
    setTime('09:00');
    setLocation('');
    setNotes('');
    setStatus('scheduled'); // new appointments always start as scheduled
    setErrors(NO_ERRORS);
    setFormError('');
  }

  function startEditing(appointment: Appointment) {
    const parts = splitTimestamp(appointment.startsAt, zone);
    setEditing(appointment);
    setDoctor(appointment.doctorName);
    setDate(parts.date);
    setTime(parts.time);
    setLocation(appointment.location ?? '');
    setNotes(appointment.notes ?? '');
    setStatus(appointment.status);
    setErrors(NO_ERRORS);
    setFormError('');
  }

  function cancelEditing() {
    setEditing(null);
  }

  async function save() {
    if (saving || !editing) return;
    const dateTime = validateDateTime(date, time);
    const next: FormErrors = {
      doctor: doctor.trim() ? '' : 'Enter the doctor’s name.',
      date: dateTime.date ?? '',
      time: dateTime.time ?? '',
    };
    setErrors(next);
    if (next.doctor || next.date || next.time) return;

    const input = {
      doctorName: doctor.trim(),
      startsAt: toTimestamp(date, time, zone),
      location: toOptionalText(location),
      notes: toOptionalText(notes),
      status,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing === 'new') await appointmentRepository.create(profileId, input);
      else await appointmentRepository.update(profileId, editing.id, input);
      setEditing(null);
      reload();
    } catch (error) {
      setFormError(toAppError(error).message);
    }
    setSaving(false);
  }

  function askToDelete(appointment: Appointment) {
    setDeleteError('');
    setPendingDelete(appointment);
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await appointmentRepository.remove(profileId, pendingDelete.id);
      setPendingDelete(null);
      reload();
    } catch (error) {
      setDeleteError(toAppError(error).message);
    }
    setDeleting(false);
  }

  // UI only: the real one-time copy to Google Calendar comes later.
  function exportToGoogleCalendar(appointment: Appointment) {
    setExportMessage(
      `Export is not connected yet. Later it will make a one-time copy of the visit with ${appointment.doctorName} in Google Calendar. Changes made afterwards will not be synced.`,
    );
  }

  return {
    profile,
    appointments,
    loading,
    loadError,
    remindersOn,
    setRemindersOn,
    exportMessage,
    editing,
    isNew: editing === 'new',
    doctor,
    date,
    time,
    location,
    notes,
    status,
    errors,
    formError,
    saving,
    setDoctor,
    setDate,
    setTime,
    setLocation,
    setNotes,
    setStatus,
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
    exportToGoogleCalendar,
  };
}
