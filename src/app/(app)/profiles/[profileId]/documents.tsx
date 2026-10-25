import { useLocalSearchParams } from 'expo-router';

import DocumentsScreen from '../../../../views/documents/DocumentsScreen';

export default function Documents() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <DocumentsScreen profileId={profileId} />;
}
