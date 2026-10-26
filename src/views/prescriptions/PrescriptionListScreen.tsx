import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorView from '../../components/ErrorView';
import DateColumn from '../../components/ledger/DateColumn';
import Dock from '../../components/ledger/Dock';
import Icon from '../../components/ledger/Icon';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import Pill from '../../components/ledger/Pill';
import SectionLabel from '../../components/ledger/SectionLabel';
import LoadingView from '../../components/LoadingView';
import { datePartsIso } from '../../models/dateTime';
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
    <LedgerScreen>
      <Stack.Screen options={{ title: `${vm.profileName} · Prescriptions` }} />
      <PageTitle text="Prescriptions" />

      {vm.prescriptions.length === 0 ? (
        <View style={styles.empty}>
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: colors.text }]}>No prescriptions yet</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Add a prescription with the doctor, visit date and medicines. You can attach a photo or PDF of it.
          </Text>
        </View>
      ) : (
        <>
          <SectionLabel label="Newest visit first" count={vm.prescriptions.length} />
          <LedgerList>
            {vm.prescriptions.map((prescription) => (
              <PrescriptionRow
                key={prescription.id}
                prescription={prescription}
                onPress={() => router.push(`/profiles/${profileId}/prescriptions/${prescription.id}`)}
              />
            ))}
          </LedgerList>
        </>
      )}

      <Dock>
        <Button title="Add prescription" onPress={() => router.push(`/profiles/${profileId}/prescriptions/new`)} />
      </Dock>
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

// One prescription: the visit date, the doctor and speciality, and the medicines on it.
function PrescriptionRow({ prescription, onPress }: { prescription: Prescription; onPress: () => void }) {
  const colors = useThemeColors();
  const count = prescription.medicines.length;
  const date = datePartsIso(prescription.visitDate);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open prescription from ${prescription.doctorName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.notice }]}>
      <DateColumn top={`${date.day} ${date.month}`} bottom={date.year} />
      <View style={styles.rowBody}>
        <Text style={[styles.doctor, { color: colors.text }]}>{prescription.doctorName}</Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>{prescription.speciality}</Text>
        <Text style={[styles.medicines, { color: colors.text }]} numberOfLines={2}>
          {count} {count === 1 ? 'medicine' : 'medicines'}: {prescription.medicines.map((m) => m.medicineName).join(', ')}
        </Text>
        {prescription.attachmentDocumentId ? (
          <View style={styles.pills}>
            <Pill label="Attachment" icon="image" color={colors.primary} borderColor={colors.primary} />
          </View>
        ) : null}
      </View>
      <Icon name="next" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rowBody: { flex: 1, gap: 2 },
  doctor: { fontSize: 16, fontWeight: '700' },
  muted: { fontSize: 14 },
  medicines: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  pills: { flexDirection: 'row', marginTop: 6 },
  empty: { paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  emptyTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  emptyText: { fontSize: 16, lineHeight: 22 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
