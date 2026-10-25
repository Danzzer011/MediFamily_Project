import { useLocalSearchParams } from 'expo-router';

import ProfileDetailsScreen from '../../../../views/profiles/ProfileDetailsScreen';

// /profiles/<id> -> profileId = "<id>"
export default function ProfileDetails() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <ProfileDetailsScreen profileId={profileId} />;
}
