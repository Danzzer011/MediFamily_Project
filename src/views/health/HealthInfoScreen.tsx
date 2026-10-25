import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { BLOOD_TYPES } from '../../models/FamilyProfile';
import { useThemeColors } from '../../theme';
import { useHealthInfoViewModel } from '../../viewmodels/health/useHealthInfoViewModel';

const NOT_RECORDED = 'Not recorded';
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
      <Screen>
        <Stack.Screen options={{ title: `${profile.name} · Health` }} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow label="Blood type" value={profile.bloodType} />
          <InfoRow label="Allergies" value={profile.allergies} />
          <InfoRow label="Medical conditions" value={profile.medicalConditions} />
          <InfoRow label="Past surgeries" value={profile.pastSurgeries} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency contacts</Text>
          {profile.emergencyContacts.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>No emergency contacts added yet.</Text>
          ) : (
            profile.emergencyContacts.map((contact) => (
              <View key={`${contact.name}-${contact.phone}`} style={styles.contactRow}>
                <Text style={[styles.value, { color: colors.text }]}>{contact.name}</Text>
                <Text style={[styles.muted, { color: colors.textMuted }]}>{contact.phone}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          “Not recorded” means the information is unknown or has not been entered yet — it does not mean none.
        </Text>
        <Button title="Edit health information" onPress={vm.startEditing} />
        <DemoDataNotice />
      </Screen>
    );
  }

  // ---- edit mode ----
  return (
    <Screen>
      <Stack.Screen options={{ title: `${profile.name} · Edit health` }} />
      {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
      {vm.staleRecord ? <Button title="Discard my edits and load latest" variant="secondary" onPress={vm.loadLatest} /> : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Blood type</Text>
        <View accessibilityRole="radiogroup" style={styles.chips}>
          {BLOOD_TYPES.map((type) => (
            <ChoiceChip key={type} label={type} selected={vm.bloodType === type} onPress={() => vm.setBloodType(type)} />
          ))}
          <ChoiceChip label="Unknown" selected={vm.bloodType === null} onPress={() => vm.setBloodType(null)} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextField label="Allergies" value={vm.allergies} onChangeText={vm.setAllergies} hint={BLANK_HINT} placeholder="e.g. Penicillin, peanuts" multiline />
        <TextField label="Medical conditions" value={vm.conditions} onChangeText={vm.setConditions} hint={BLANK_HINT} placeholder="e.g. Asthma" multiline />
        <TextField label="Past surgeries" value={vm.surgeries} onChangeText={vm.setSurgeries} hint={BLANK_HINT} placeholder="e.g. Appendectomy, 2015" multiline />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency contacts</Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>Each contact needs a name and a telephone number.</Text>
        {vm.contacts.map((contact, index) => {
          const errors = vm.contactErrors[contact.key];
          return (
            <View key={contact.key} style={[styles.contactCard, { borderColor: colors.border }]}>
              <View style={styles.contactHeader}>
                <Text style={[styles.contactTitle, { color: colors.text }]}>Contact {index + 1}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove contact ${index + 1}`} onPress={() => vm.removeContact(contact.key)}>
                  <Text style={[styles.remove, { color: colors.danger }]}>Remove</Text>
                </Pressable>
              </View>
              <TextField
                label="Name"
                value={contact.name}
                onChangeText={(text) => vm.changeContact(contact.key, 'name', text)}
                error={errors?.name}
                autoCapitalize="words"
              />
              <TextField
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
        <Button title="Add emergency contact" variant="secondary" onPress={vm.addContact} />
      </View>

      <Button title="Save health information" loading={vm.saving} onPress={vm.save} />
      <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={vm.cancelEditing} />
      <DemoDataNotice />
    </Screen>
  );
}

// One label + value row. A missing value is shown as "Not recorded", never as "None".
function InfoRow({ label, value }: { label: string; value: string | null }) {
  const colors = useThemeColors();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {value ? (
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      ) : (
        <Text style={[styles.notRecorded, { color: colors.textMuted }]}>{NOT_RECORDED}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  infoRow: { gap: 2 },
  label: { fontSize: 14, fontWeight: '600' },
  value: { fontSize: 16, lineHeight: 22 },
  notRecorded: { fontSize: 16, fontStyle: 'italic' },
  muted: { fontSize: 14 },
  note: { fontSize: 13, textAlign: 'center' },
  contactRow: { gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contactCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactTitle: { fontSize: 15, fontWeight: '700' },
  remove: { fontSize: 15, fontWeight: '700', paddingVertical: 6, paddingHorizontal: 4 },
});
