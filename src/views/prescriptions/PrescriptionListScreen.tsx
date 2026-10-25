import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import { formatIsoDate } from '../../models/dates';
import type { Prescription } from '../../models/Prescription';
import { useThemeColors } from '../../theme';
import { usePrescriptionsViewModel } from '../../viewmodels/prescriptions/usePrescriptionsViewModel';

// Prescriptions page (FR04): the profile's prescriptions, newest visit first.
export default function PrescriptionListScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = usePrescriptionsViewModel(profileId);

  if (vm.loading) return <LoadingView message="Loading prescriptions…" />;
  if (vm.loadError) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `${vm.profileName} · Prescriptions` }} />
      <Button title="Add prescription" onPress={() => router.push(`/profiles/${profileId}/prescriptions/new`)} />

      {vm.prescriptions.length === 0 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>No prescriptions yet</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Add a prescription with the doctor, visit date and medicines. You can attach a photo or PDF of it.
          </Text>
        </View>
      ) : (
        vm.prescriptions.map((prescription) => (
          <PrescriptionCard
            key={prescription.id}
            prescription={prescription}
            onPress={() => router.push(`/profiles/${profileId}/prescriptions/${prescription.id}`)}
          />
        ))
      )}

      <DemoDataNotice />
    </Screen>
  );
}

function PrescriptionCard({ prescription, onPress }: { prescription: Prescription; onPress: () => void }) {
  const colors = useThemeColors();
  const count = prescription.medicines.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open prescription from ${prescription.doctorName}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{prescription.doctorName}</Text>
        {prescription.attachmentDocumentId ? (
          <Text style={[styles.badge, { color: colors.primary, borderColor: colors.primary }]}>Attachment</Text>
        ) : null}
      </View>
      <Text style={[styles.muted, { color: colors.textMuted }]}>
        {prescription.speciality} · {formatIsoDate(prescription.visitDate)}
      </Text>
      <Text style={[styles.medicines, { color: colors.text }]} numberOfLines={2}>
        {count} {count === 1 ? 'medicine' : 'medicines'}: {prescription.medicines.map((m) => m.medicineName).join(', ')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 8 },
  pressed: { opacity: 0.8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '700', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  muted: { fontSize: 14 },
  medicines: { fontSize: 15 },
});
