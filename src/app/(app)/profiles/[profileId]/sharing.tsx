import { useLocalSearchParams } from 'expo-router';

import SharingScreen from '../../../../views/sharing/SharingScreen';

export default function Sharing() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <SharingScreen profileId={profileId} />;
}
