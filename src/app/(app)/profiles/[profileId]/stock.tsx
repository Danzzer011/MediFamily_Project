import { useLocalSearchParams } from 'expo-router';

import StockScreen from '../../../../views/stock/StockScreen';

export default function Stock() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <StockScreen profileId={profileId} />;
}
