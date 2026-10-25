import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { isValidIsoDate, todayIsoDate } from '../../models/dates';
import { AppError, toAppError } from '../../models/errors';
import type { FamilyProfile } from '../../models/FamilyProfile';
import type { DocumentCategory, MedicalDocument, PickedFile } from '../../models/MedicalDocument';
import { documentRepository } from '../../repositories/documentRepository';
import { profileRepository } from '../../repositories/profileRepository';
import { chooseImage, choosePdf, takePhoto } from '../../services/filePickerService';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

type Mode = 'list' | 'add' | 'view' | 'edit';
type FormErrors = { title: string; category: string; date: string; file: string };
const NO_ERRORS: FormErrors = { title: '', category: '', date: '', file: '' };

export type FileSource = 'camera' | 'image' | 'pdf';

const CAMERA_UNAVAILABLE = 'The camera is not available here. Use “Choose file”, or open MediFamily on your phone.';

// The camera or the file window can fail (blocked, or missing). Say so instead of crashing.
function pickMessage(error: unknown, source: FileSource): string {
  if (error instanceof AppError) return error.message;
  return source === 'camera' ? CAMERA_UNAVAILABLE : 'That file could not be opened. Try another one.';
}

// ViewModel for the Medical Documents page (FR07): list, add, open, edit details and delete.
export function useDocumentsViewModel(profileId: string) {
  const { reloadKey, reload } = useReloadOnFocus();

  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [mode, setMode] = useState<Mode>('list');
  const [selected, setSelected] = useState<MedicalDocument | null>(null); // the document being viewed or edited

  // form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory | null>(null);
  const [date, setDate] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [choosingKind, setChoosingKind] = useState(false); // "Choose file" is open and asks: image or PDF?
  const [picking, setPicking] = useState(false);
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // delete confirmation
  const [pendingDelete, setPendingDelete] = useState<MedicalDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    Promise.all([profileRepository.getProfile(profileId), documentRepository.list(profileId)])
      .then(([loadedProfile, loadedList]) => {
        if (!active) return;
        setLoadError('');
        setProfile(loadedProfile);
        setDocuments(loadedList);
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

  function startAdding() {
    setTitle('');
    setCategory(null);
    setDate(todayIsoDate());
    setFile(null);
    setChoosingKind(false);
    setErrors(NO_ERRORS);
    setFormError('');
    setMode('add');
  }

  function startEditing(document: MedicalDocument) {
    setSelected(document);
    setTitle(document.title);
    setCategory(document.category);
    setDate(document.relevantDate);
    setErrors(NO_ERRORS);
    setFormError('');
    setMode('edit');
  }

  function openDocument(document: MedicalDocument) {
    setSelected(document);
    setMode('view');
  }

  function backToList() {
    setMode('list');
  }

  // Cancel in a form: editing goes back to the document, adding goes back to the list.
  function cancelForm() {
    setMode(mode === 'edit' && selected ? 'view' : 'list');
  }

  function clearFile() {
    setFile(null);
  }

  function toggleChoosingKind() {
    setChoosingKind((open) => !open);
  }

  // Takes a photo or chooses an image or PDF with the team's file picker.
  async function pickFile(source: FileSource) {
    if (picking) return;
    setChoosingKind(false);
    // a desktop browser never answers the camera request, which would also block the other buttons
    if (source === 'camera' && Platform.OS === 'web') {
      setErrors((current) => ({ ...current, file: CAMERA_UNAVAILABLE }));
      return;
    }
    setPicking(true);
    setErrors((current) => ({ ...current, file: '' }));
    try {
      const picked = source === 'camera' ? await takePhoto() : source === 'image' ? await chooseImage() : await choosePdf();
      if (picked) setFile(picked);
    } catch (error) {
      setErrors((current) => ({ ...current, file: pickMessage(error, source) }));
    }
    setPicking(false);
  }

  async function save() {
    if (saving) return;
    const next: FormErrors = {
      title: title.trim() ? '' : 'Enter a title.',
      category: category ? '' : 'Choose a category.',
      date: !date.trim() ? 'Enter the date.' : isValidIsoDate(date.trim()) ? '' : 'Use the format YYYY-MM-DD, e.g. 2026-11-03.',
      file: mode === 'add' && !file ? 'Take a photo or choose a file.' : '',
    };
    setErrors(next);
    if (next.title || next.category || next.date || next.file || !category) return;

    const details = { title: title.trim(), category, relevantDate: date.trim() };
    setSaving(true);
    setFormError('');
    try {
      if (mode === 'add' && file) {
        await documentRepository.create(profileId, details, file);
        setMode('list');
      } else if (selected) {
        setSelected(await documentRepository.updateDetails(profileId, selected.id, details));
        setMode('view');
      }
      reload();
    } catch (error) {
      setFormError(toAppError(error).message);
    }
    setSaving(false);
  }

  function askToDelete(document: MedicalDocument) {
    setDeleteError('');
    setPendingDelete(document);
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await documentRepository.remove(profileId, pendingDelete.id);
      setPendingDelete(null);
      setMode('list');
      reload();
    } catch (error) {
      setDeleteError(toAppError(error).message);
    }
    setDeleting(false);
  }

  return {
    profile,
    documents,
    loading,
    loadError,
    mode,
    selected,
    title,
    category,
    date,
    file,
    choosingKind,
    picking,
    errors,
    formError,
    saving,
    setTitle,
    setCategory,
    setDate,
    startAdding,
    startEditing,
    openDocument,
    backToList,
    cancelForm,
    clearFile,
    toggleChoosingKind,
    pickFile,
    save,
    pendingDelete,
    deleting,
    deleteError,
    askToDelete,
    cancelDelete,
    confirmDelete,
  };
}
