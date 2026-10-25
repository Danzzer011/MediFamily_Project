import { useLocalSearchParams } from 'expo-router';

import ProfileFormScreen from '../../../../views/profiles/ProfileFormScreen';

export default function EditProfile() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <ProfileFormScreen profileId={profileId} />;
}
