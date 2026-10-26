import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import Dock from '../../components/ledger/Dock';
import InfoRow from '../../components/ledger/InfoRow';
import LedgerField from '../../components/ledger/LedgerField';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import SectionLabel from '../../components/ledger/SectionLabel';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
import { BLOOD_TYPES } from '../../models/FamilyProfile';
import { useThemeColors } from '../../theme';
import { useHealthInfoViewModel } from '../../viewmodels/health/useHealthInfoViewModel';

const BLANK_HINT = 'Leave blank if unknown. Blank is saved as “Not recorded”, not as “none”.';

// Health Information page (FR02): view and update blood type, allergies,
// conditions, surgeries and emergency contacts.
export default function HealthInfoScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useHealthInfoViewModel(profileId);

  if (vm.loading) return <LoadingView message="Loading health information…" />;
  if (vm.loadError || !vm.profile) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }
  const profile = vm.profile;

  // ---- view mode ----
  if (!vm.editing) {
    return (
      <LedgerScreen>
        <Stack.Screen options={{ title: `${profile.name} · Health` }} />
        <PageTitle text="Health information" />

        <SectionLabel label="Medical details" />
        <LedgerList>
          <InfoRow label="Blood type" value={profile.bloodType} />
          <InfoRow label="Allergies" value={profile.allergies} />
          <InfoRow label="Medical conditions" value={profile.medicalConditions} />
          <InfoRow label="Past surgeries" value={profile.pastSurgeries} />
        </LedgerList>

        <SectionLabel label="Emergency contacts" count={profile.emergencyContacts.length} />
        {profile.emergencyContacts.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>No emergency contacts added yet.</Text>
        ) : (
          <LedgerList>
            {profile.emergencyContacts.map((contact) => (
              <InfoRow key={`${contact.name}-${contact.phone}`} label={contact.name} value={contact.phone} />
            ))}
          </LedgerList>
        )}

        <Text style={[styles.note, { color: colors.textMuted }]}>
          “Not recorded” means the information is unknown or has not been entered yet — it does not mean none.
        </Text>
        <Dock>
          <Button title="Edit health information" onPress={vm.startEditing} />
        </Dock>
        <View style={styles.demoNotice}>
          <DemoDataNotice />
        </View>
      </LedgerScreen>
    );
  }

  // ---- edit mode ----
  return (
    <LedgerScreen>
      <Stack.Screen options={{ title: `${profile.name} · Edit health` }} />
      <PageTitle text="Edit health information" />
      {vm.formError || vm.staleRecord ? (
        <View style={styles.padded}>
          {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
          {vm.staleRecord ? (
            <Button title="Discard my edits and load latest" variant="secondary" onPress={vm.loadLatest} />
          ) : null}
        </View>
      ) : null}

      <SectionLabel label="Blood type" />
      <View accessibilityRole="radiogroup" style={styles.chips}>
        {BLOOD_TYPES.map((type) => (
          <ChoiceChip key={type} label={type} selected={vm.bloodType === type} onPress={() => vm.setBloodType(type)} />
        ))}
        <ChoiceChip label="Unknown" selected={vm.bloodType === null} onPress={() => vm.setBloodType(null)} />
      </View>

      <SectionLabel label="Medical details" />
      <View style={styles.form}>
        <LedgerField label="Allergies" tag="Optional" value={vm.allergies} onChangeText={vm.setAllergies} hint={BLANK_HINT} placeholder="e.g. Penicillin, peanuts" multiline />
        <LedgerField label="Medical conditions" tag="Optional" value={vm.conditions} onChangeText={vm.setConditions} hint={BLANK_HINT} placeholder="e.g. Asthma" multiline />
        <LedgerField label="Past surgeries" tag="Optional" value={vm.surgeries} onChangeText={vm.setSurgeries} hint={BLANK_HINT} placeholder="e.g. Appendectomy, 2015" multiline />
      </View>

      <SectionLabel label="Emergency contacts" count={vm.contacts.length} />
      <Text style={[styles.sectionHint, { color: colors.textMuted }]}>Each contact needs a name and a telephone number.</Text>
      {vm.contacts.length > 0 ? (
        <LedgerList>
          {vm.contacts.map((contact, index) => {
            const errors = vm.contactErrors[contact.key];
            return (
              <View key={contact.key} style={styles.contact}>
                <View style={styles.contactHeader}>
                  <Text style={[styles.contactTitle, { color: colors.text }]}>Contact {index + 1}</Text>
                  <LinkAction
                    label="Remove"
                    danger
                    accessibilityLabel={`Remove contact ${index + 1}`}
                    onPress={() => vm.removeContact(contact.key)}
                  />
                </View>
                <LedgerField
                  label="Name"
                  value={contact.name}
                  onChangeText={(text) => vm.changeContact(contact.key, 'name', text)}
                  error={errors?.name}
                  autoCapitalize="words"
                />
                <LedgerField
                  label="Telephone number"
                  value={contact.phone}
                  onChangeText={(text) => vm.changeContact(contact.key, 'phone', text)}
                  error={errors?.phone}
                  placeholder="e.g. +20 100 123 4567"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            );
          })}
        </LedgerList>
      ) : null}
      <View style={styles.padded}>
        <Button title="Add emergency contact" variant="secondary" onPress={vm.addContact} />
      </View>

      <Dock>
        <Button title="Save health information" loading={vm.saving} onPress={vm.save} />
        <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={vm.cancelEditing} />
      </Dock>
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

const styles = StyleSheet.create({
  padded: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  empty: { fontSize: 15, paddingHorizontal: 16 },
  note: { fontSize: 13, lineHeight: 18, paddingHorizontal: 16, paddingTop: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  form: { paddingHorizontal: 16, gap: 14 },
  sectionHint: { fontSize: 13, paddingHorizontal: 16, paddingBottom: 8 },
  contact: { padding: 16, gap: 12 },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactTitle: { fontSize: 15, fontWeight: '700' },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
