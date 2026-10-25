import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { COMMON_STOCK_UNITS } from '../../models/Medication';
import { useThemeColors } from '../../theme';
import { useStockFormViewModel } from '../../viewmodels/stock/useStockFormViewModel';

// Update one medication's stock by hand (FR06).
export default function StockFormScreen({ medicationId }: { medicationId: string }) {
  const colors = useThemeColors();
  const vm = useStockFormViewModel(medicationId);

  async function save() {
    const saved = await vm.save();
    if (saved) router.back();
  }

  async function confirmStopTracking() {
    const stopped = await vm.confirmStopTracking();
    if (stopped) router.back();
  }

  if (vm.loading) return <LoadingView message="Loading stock…" />;
  if (vm.loadError || !vm.medication) {
    return <ErrorView message={vm.loadError} actionTitle="Back" onAction={() => router.back()} />;
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `${vm.medication.name} · Stock` }} />
      {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
      {vm.staleRecord ? (
        <Button title="Discard my edits and load latest" variant="secondary" onPress={vm.reloadLatest} />
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Remaining quantity</Text>
        <TextField
          label="Quantity left"
          value={vm.quantity}
          onChangeText={vm.changeQuantity}
          error={vm.quantityError}
          placeholder="e.g. 30"
          keyboardType="decimal-pad"
        />
        <View style={styles.adjustRow}>
          <View style={styles.adjustButton}>
            <Button title="− 1" variant="secondary" onPress={() => vm.adjustQuantity(-1)} />
          </View>
          <View style={styles.adjustButton}>
            <Button title="+ 1" variant="secondary" onPress={() => vm.adjustQuantity(1)} />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
        <View accessibilityRole="radiogroup" style={styles.chips}>
          {COMMON_STOCK_UNITS.map((option) => (
            <ChoiceChip key={option} label={option} selected={vm.unit === option} onPress={() => vm.changeUnit(option)} />
          ))}
        </View>
        <TextField
          label="Or type another unit"
          value={vm.unit}
          onChangeText={vm.changeUnit}
          error={vm.unitError}
          placeholder="e.g. sachets"
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Refill alert</Text>
        <TextField
          label="Alert when this much is left or less"
          value={vm.threshold}
          onChangeText={vm.changeThreshold}
          error={vm.thresholdError}
          hint="Uses the same unit as the quantity."
          placeholder="e.g. 7"
          keyboardType="decimal-pad"
        />
        {vm.wouldNeedRefill ? (
          <Text style={[styles.preview, { color: colors.danger }]}>
            After saving, this medication will show a refill alert.
          </Text>
        ) : null}
      </View>

      <Button title="Save stock" loading={vm.saving} onPress={save} />
      <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={() => router.back()} />
      {vm.isTracked ? (
        <Button title="Stop tracking stock" variant="danger" disabled={vm.saving} onPress={vm.askToStopTracking} />
      ) : null}
      <DemoDataNotice />

      <ConfirmDialog
        visible={vm.confirmingStop}
        title="Stop tracking stock?"
        message={
          `This clears the saved quantity, unit and refill threshold of ${vm.medication.name}. ` +
          'The medication and its schedule stay as they are.'
        }
        confirmTitle="Stop tracking"
        destructive
        loading={vm.saving}
        error={vm.formError}
        onConfirm={confirmStopTracking}
        onCancel={vm.cancelStopTracking}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '600' },
  adjustRow: { flexDirection: 'row', gap: 12 },
  adjustButton: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preview: { fontSize: 14, fontWeight: '600' },
});
