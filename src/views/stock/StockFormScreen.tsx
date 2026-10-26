import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import Dock from '../../components/ledger/Dock';
import LedgerField from '../../components/ledger/LedgerField';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import SectionLabel from '../../components/ledger/SectionLabel';
import LoadingView from '../../components/LoadingView';
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
    <LedgerScreen>
      <Stack.Screen options={{ title: `${vm.medication.name} · Stock` }} />
      <PageTitle text="Update stock" />
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{vm.medication.name}</Text>
      {vm.formError || vm.staleRecord ? (
        <View style={styles.padded}>
          {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
          {vm.staleRecord ? (
            <Button title="Discard my edits and load latest" variant="secondary" onPress={vm.reloadLatest} />
          ) : null}
        </View>
      ) : null}

      <SectionLabel label="Remaining quantity" />
      <View style={styles.form}>
        <View style={styles.quantityRow}>
          <View style={styles.step}>
            <Button title="− 1" variant="secondary" onPress={() => vm.adjustQuantity(-1)} />
          </View>
          <View style={styles.quantityField}>
            <LedgerField
              label="Quantity left"
              value={vm.quantity}
              onChangeText={vm.changeQuantity}
              error={vm.quantityError}
              placeholder="e.g. 30"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.step}>
            <Button title="+ 1" variant="secondary" onPress={() => vm.adjustQuantity(1)} />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
        <View accessibilityRole="radiogroup" style={styles.chips}>
          {COMMON_STOCK_UNITS.map((option) => (
            <ChoiceChip key={option} label={option} selected={vm.unit === option} onPress={() => vm.changeUnit(option)} />
          ))}
        </View>
        <LedgerField label="Or type another unit" value={vm.unit} onChangeText={vm.changeUnit} error={vm.unitError} placeholder="e.g. sachets" />
      </View>

      <SectionLabel label="Refill alert" />
      <View style={styles.form}>
        <LedgerField
          label="Alert when this much is left or less"
          value={vm.threshold}
          onChangeText={vm.changeThreshold}
          error={vm.thresholdError}
          hint="Uses the same unit as the quantity."
          placeholder="e.g. 7"
          keyboardType="decimal-pad"
        />
        {vm.wouldNeedRefill ? (
          <Text style={[styles.preview, { color: colors.danger }]}>After saving, this medication will show a refill alert.</Text>
        ) : null}
      </View>

      <Dock>
        <Button title="Save stock" loading={vm.saving} onPress={save} />
        <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={() => router.back()} />
      </Dock>
      {vm.isTracked ? (
        <View style={[styles.danger, { borderColor: colors.border }]}>
          <Button title="Stop tracking stock" variant="danger" disabled={vm.saving} onPress={vm.askToStopTracking} />
        </View>
      ) : null}
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>

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
    </LedgerScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 16, paddingHorizontal: 16, marginTop: -6 },
  padded: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  form: { paddingHorizontal: 16, gap: 14 },
  quantityRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  quantityField: { flex: 1 },
  step: { width: 72 },
  label: { fontSize: 15, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preview: { fontSize: 14, fontWeight: '600' },
  danger: { marginTop: 28, paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
