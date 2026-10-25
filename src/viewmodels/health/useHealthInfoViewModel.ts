import { useEffect, useState } from 'react';

import { toAppError } from '../../models/errors';
import type { BloodType, FamilyProfile, HealthInformation } from '../../models/FamilyProfile';
import { toOptionalText, validateEmergencyContact } from '../../models/validation';
import { profileRepository } from '../../repositories/profileRepository';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// One emergency contact row in the form. `key` is a stable id for React lists.
export type ContactInput = { key: string; name: string; phone: string };
type ContactErrors = { name: string; phone: string };

let nextContactKey = 0;
function newContactKey() {
  nextContactKey += 1;
  return `contact-${nextContactKey}`;
}

// ViewModel for the Health Information page (FR02): view the saved information,
// edit it, and save it. Unknown information stays unspecified (null), never "none".
export function useHealthInfoViewModel(profileId: string) {
  const { reloadKey, reload } = useReloadOnFocus();

  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // form state, only used while editing
  const [editing, setEditing] = useState(false);
  const [editVersion, setEditVersion] = useState(0); // version the edit started from
  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [surgeries, setSurgeries] = useState('');
  const [contacts, setContacts] = useState<ContactInput[]>([]);
  const [contactErrors, setContactErrors] = useState<Record<string, ContactErrors>>({});
  const [formError, setFormError] = useState('');
  const [staleRecord, setStaleRecord] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    profileRepository
      .getProfile(profileId)
      .then((loaded) => {
        if (!active) return;
        setLoadError('');
        setProfile(loaded);
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

  // copy the saved information into the form
  function startEditing() {
    if (!profile) return;
    setEditVersion(profile.version);
    setBloodType(profile.bloodType);
    setAllergies(profile.allergies ?? '');
    setConditions(profile.medicalConditions ?? '');
    setSurgeries(profile.pastSurgeries ?? '');
    setContacts(profile.emergencyContacts.map((c) => ({ key: newContactKey(), name: c.name, phone: c.phone })));
    setContactErrors({});
    setFormError('');
    setStaleRecord(false);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setFormError('');
    setStaleRecord(false);
  }

  // after a stale-version error: drop the edits and show the latest saved version
  function loadLatest() {
    cancelEditing();
    reload();
  }

  function addContact() {
    setContacts((current) => [...current, { key: newContactKey(), name: '', phone: '' }]);
  }

  function removeContact(key: string) {
    setContacts((current) => current.filter((c) => c.key !== key));
  }

  function changeContact(key: string, field: 'name' | 'phone', text: string) {
    setContacts((current) => current.map((c) => (c.key === key ? { ...c, [field]: text } : c)));
    setContactErrors((current) => {
      const existing = current[key];
      if (!existing) return current;
      return { ...current, [key]: { ...existing, [field]: '' } };
    });
    setFormError('');
  }

  // returns true when saved
  async function save(): Promise<boolean> {
    if (saving || !profile) return false;

    // 1. every emergency contact needs a name and a telephone number
    const errors: Record<string, ContactErrors> = {};
    let hasErrors = false;
    for (const contact of contacts) {
      const problems = validateEmergencyContact(contact);
      errors[contact.key] = { name: problems.name ?? '', phone: problems.phone ?? '' };
      if (problems.name || problems.phone) hasErrors = true;
    }
    setContactErrors(errors);
    setFormError(hasErrors ? 'Check the emergency contacts below.' : '');
    if (hasErrors) return false;

    // 2. blank text is saved as null ("not recorded")
    const info: HealthInformation = {
      bloodType,
      allergies: toOptionalText(allergies),
      medicalConditions: toOptionalText(conditions),
      pastSurgeries: toOptionalText(surgeries),
      emergencyContacts: contacts.map((c) => ({ name: c.name.trim(), phone: c.phone.trim() })),
    };

    setSaving(true);
    try {
      const saved = await profileRepository.updateHealthInformation(profile.id, editVersion, info);
      setProfile(saved);
      setEditing(false);
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

  return {
    profile,
    loading,
    loadError,
    editing,
    bloodType,
    allergies,
    conditions,
    surgeries,
    contacts,
    contactErrors,
    formError,
    staleRecord,
    saving,
    startEditing,
    cancelEditing,
    loadLatest,
    setBloodType,
    setAllergies,
    setConditions,
    setSurgeries,
    addContact,
    removeContact,
    changeContact,
    save,
  };
}
