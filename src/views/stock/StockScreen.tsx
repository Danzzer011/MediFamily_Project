import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
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

  return (
    <Screen>
      <Stack.Screen options={{ title: `${vm.profileName} · Medicine stock` }} />

      {vm.refillAlerts.length > 0 ? (
        <View
          accessibilityRole="alert"
          style={[styles.alert, { backgroundColor: colors.dangerSurface, borderColor: colors.danger }]}>
          <Text style={[styles.alertTitle, { color: colors.danger }]}>
            Refill needed ({vm.refillAlerts.length})
          </Text>
          {vm.refillAlerts.map((medication) => (
            <Text key={medication.id} style={[styles.alertText, { color: colors.text }]}>
              {medication.name}: {medication.remainingQuantity} {medication.stockUnit} left
            </Text>
          ))}
        </View>
      ) : null}

      {vm.medications.length === 0 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>No medications yet</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Add a medication first, then record how much of it is left.
          </Text>
          <Button
            title="Go to medications"
            variant="secondary"
            onPress={() => router.push(`/profiles/${profileId}/medications`)}
          />
        </View>
      ) : (
        vm.medications.map((medication) => (
          <StockCard
            key={medication.id}
            medication={medication}
            onPress={() => router.push(`/profiles/${profileId}/medications/${medication.id}/stock`)}
          />
        ))
      )}

      <Text style={[styles.note, { color: colors.textMuted }]}>
        Stock is updated by hand. Reminders never change the quantity.
      </Text>
      <DemoDataNotice />
    </Screen>
  );
}

// One medication's stock. Untracked stock is shown as "Not tracked", never as zero.
function StockCard({ medication, onPress }: { medication: Medication; onPress: () => void }) {
  const colors = useThemeColors();
  const stock = stockOf(medication);
  const refill = needsRefill(medication);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Update stock of ${medication.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: refill ? colors.danger : colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{medication.name}</Text>
        {refill ? (
          <Text style={[styles.badge, { color: colors.danger, borderColor: colors.danger }]}>Refill needed</Text>
        ) : null}
      </View>
      {stock ? (
        <>
          <Text style={[styles.quantity, { color: refill ? colors.danger : colors.text }]}>
            {stock.remainingQuantity} {stock.stockUnit} left
          </Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Refill alert at {stock.refillThreshold} {stock.stockUnit} or less
          </Text>
        </>
      ) : (
        <Text style={[styles.notTracked, { color: colors.textMuted }]}>Not tracked — tap to record the stock</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  alert: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 8, padding: 16, gap: 4 },
  alertTitle: { fontSize: 15, fontWeight: '700' },
  alertText: { fontSize: 16 },
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 8 },
  pressed: { opacity: 0.8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '700', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  quantity: { fontSize: 22, fontWeight: '700' },
  muted: { fontSize: 14 },
  notTracked: { fontSize: 16, fontStyle: 'italic' },
  note: { fontSize: 13, textAlign: 'center' },
});
