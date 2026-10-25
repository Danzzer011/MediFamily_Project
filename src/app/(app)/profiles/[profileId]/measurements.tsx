import { useLocalSearchParams } from 'expo-router';

import MeasurementsScreen from '../../../../views/measurements/MeasurementsScreen';

export default function Measurements() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <MeasurementsScreen profileId={profileId} />;
}
