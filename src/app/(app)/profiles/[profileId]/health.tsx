import { useLocalSearchParams } from 'expo-router';

import HealthInfoScreen from '../../../../views/health/HealthInfoScreen';

export default function Health() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <HealthInfoScreen profileId={profileId} />;
}
