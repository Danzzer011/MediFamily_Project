import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorView from '../../components/ErrorView';
import Icon from '../../components/ledger/Icon';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import Pill from '../../components/ledger/Pill';
import SectionLabel from '../../components/ledger/SectionLabel';
import LoadingView from '../../components/LoadingView';
import { needsRefill, stockOf, type Medication } from '../../models/Medication';
import { useThemeColors } from '../../theme';
import { useStockViewModel } from '../../viewmodels/stock/useStockViewModel';

// Medicine Stock page (FR06): remaining quantity of each medication and refill alerts.
// Tapping a medication opens its stock form.
export default function StockScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useStockViewModel(profileId);

  if (vm.loading) return <LoadingView message="Loading medicine stock…" />;
  if (vm.loadError) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }

  const tracked = vm.medications.filter((m) => stockOf(m) !== null && !needsRefill(m));
  const notTracked = vm.medications.filter((m) => stockOf(m) === null);
  const openStock = (medication: Medication) => router.push(`/profiles/${profileId}/medications/${medication.id}/stock`);

  return (
    <LedgerScreen>
      <Stack.Screen options={{ title: `${vm.profileName} · Medicine stock` }} />
      <PageTitle text="Medicine stock" />

      {vm.refillAlerts.length > 0 ? (
        <View
          accessibilityRole="alert"
          style={[styles.alert, { backgroundColor: colors.dangerSurface, borderColor: colors.danger }]}>
          <Text style={[styles.alertTitle, { color: colors.danger }]}>Refill needed ({vm.refillAlerts.length})</Text>
          {vm.refillAlerts.map((medication) => (
            <Text key={medication.id} style={[styles.alertText, { color: colors.text }]}>
              {medication.name}: {medication.remainingQuantity} {medication.stockUnit} left
            </Text>
          ))}
        </View>
      ) : null}

      {vm.medications.length === 0 ? (
        <View style={styles.empty}>
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: colors.text }]}>No medications yet</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Add a medication first, then record how much of it is left.
          </Text>
          <Button title="Go to medications" variant="secondary" onPress={() => router.push(`/profiles/${profileId}/medications`)} />
        </View>
      ) : (
        <>
          {vm.refillAlerts.length > 0 ? (
            <>
              <SectionLabel label="Refill needed" count={vm.refillAlerts.length} />
              <LedgerList>
                {vm.refillAlerts.map((m) => (
                  <StockRow key={m.id} medication={m} onPress={() => openStock(m)} />
                ))}
              </LedgerList>
            </>
          ) : null}
          {tracked.length > 0 ? (
            <>
              <SectionLabel label="In stock" count={tracked.length} />
              <LedgerList>
                {tracked.map((m) => (
                  <StockRow key={m.id} medication={m} onPress={() => openStock(m)} />
                ))}
              </LedgerList>
            </>
          ) : null}
          {notTracked.length > 0 ? (
            <>
              <SectionLabel label="Not tracked" count={notTracked.length} />
              <LedgerList>
                {notTracked.map((m) => (
                  <StockRow key={m.id} medication={m} onPress={() => openStock(m)} />
                ))}
              </LedgerList>
            </>
          ) : null}
        </>
      )}

      <Text style={[styles.note, { color: colors.textMuted }]}>Stock is updated by hand. Reminders never change the quantity.</Text>
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

// One medication's stock: the amount left in large type, like a measurement reading.
// Untracked stock is shown as "Not tracked", never as zero.
function StockRow({ medication, onPress }: { medication: Medication; onPress: () => void }) {
  const colors = useThemeColors();
  const stock = stockOf(medication);
  const refill = needsRefill(medication);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Update stock of ${medication.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.notice }]}>
      <View style={styles.rowBody}>
        <View style={styles.nameLine}>
          <Text style={[styles.name, { color: colors.text }]}>{medication.name}</Text>
          {refill ? <Pill label="Refill needed" color={colors.danger} background={colors.dangerSurface} /> : null}
        </View>
        {stock ? (
          <>
            <Text style={[styles.quantity, { color: refill ? colors.danger : colors.text }]}>
              {stock.remainingQuantity} <Text style={[styles.unit, { color: colors.textMuted }]}>{stock.stockUnit} left</Text>
            </Text>
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              Refill alert at {stock.refillThreshold} {stock.stockUnit} or less
            </Text>
          </>
        ) : (
          <Text style={[styles.notTracked, { color: colors.textMuted }]}>Not tracked — tap to record the stock</Text>
        )}
      </View>
      <Icon name="next" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  alert: { marginHorizontal: 16, borderWidth: 1, borderLeftWidth: 4, borderRadius: 8, padding: 14, gap: 4 },
  alertTitle: { fontSize: 15, fontWeight: '700' },
  alertText: { fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rowBody: { flex: 1, gap: 2 },
  nameLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '700' },
  quantity: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  unit: { fontSize: 14, fontWeight: '400' },
  muted: { fontSize: 13 },
  notTracked: { fontSize: 15, fontStyle: 'italic' },
  empty: { paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  emptyTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  emptyText: { fontSize: 16, lineHeight: 22, marginBottom: 8 },
  note: { fontSize: 13, textAlign: 'center', paddingHorizontal: 16, paddingTop: 20 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 12 },
});
