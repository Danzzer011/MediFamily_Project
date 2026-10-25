import { useEffect, useState } from 'react';

import { isValidIsoDate, todayIsoDate } from '../../models/dates';
import { toAppError } from '../../models/errors';
import type { FamilyProfile } from '../../models/FamilyProfile';
import type { DocumentCategory, DocumentFile, MedicalDocument } from '../../models/MedicalDocument';
import { documentRepository } from '../../repositories/documentRepository';
import { profileRepository } from '../../repositories/profileRepository';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

type Mode = 'list' | 'add' | 'view' | 'edit';
type FormErrors = { title: string; category: string; date: string; file: string };
const NO_ERRORS: FormErrors = { title: '', category: '', date: '', file: '' };

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
  const [file, setFile] = useState<DocumentFile | null>(null);
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

  // Phase 1: buttons only. Real camera and file picking come in Phase 2, so we attach a labelled demo file.
  function attachDemoFile(demoFile: DocumentFile) {
    setFile(demoFile);
    setErrors((current) => ({ ...current, file: '' }));
  }

  function takePhoto() {
    attachDemoFile({ fileName: 'photo-demo.jpg', fileType: 'image' });
  }

  function chooseFile() {
    attachDemoFile({ fileName: 'document-demo.pdf', fileType: 'pdf' });
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
    takePhoto,
    chooseFile,
    save,
    pendingDelete,
    deleting,
    deleteError,
    askToDelete,
    cancelDelete,
    confirmDelete,
  };
}
