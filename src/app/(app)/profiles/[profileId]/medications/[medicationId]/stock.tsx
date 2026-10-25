import { useLocalSearchParams } from 'expo-router';

import StockFormScreen from '../../../../../../views/stock/StockFormScreen';

export default function MedicationStock() {
  const { medicationId } = useLocalSearchParams<{ medicationId: string }>();
  return <StockFormScreen medicationId={medicationId} />;
}
