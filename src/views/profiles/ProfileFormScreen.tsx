import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import DateField from '../../components/ledger/DateField';
import Dock from '../../components/ledger/Dock';
import LedgerField from '../../components/ledger/LedgerField';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import LoadingView from '../../components/LoadingView';
import { useThemeColors } from '../../theme';
import { useProfileFormViewModel } from '../../viewmodels/profiles/useProfileFormViewModel';

// Create or edit a family profile (FR01). With a profileId it edits, without one it creates.
export default function ProfileFormScreen({ profileId }: { profileId?: string }) {
  const colors = useThemeColors();
  const vm = useProfileFormViewModel(profileId);
  const title = vm.isEditing ? 'Edit profile' : 'New profile';

  async function save() {
    const savedId = await vm.save();
    if (!savedId) return;
    // a new profile opens straight away; an edit goes back to where we came from
    if (vm.isEditing) router.back();
    else router.replace(`/profiles/${savedId}`);
  }

  if (vm.loading) return <LoadingView message="Loading profile…" />;
  if (vm.loadError) return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;

  return (
    <LedgerScreen>
      <Stack.Screen options={{ title }} />
      <PageTitle text={title} />
      {!vm.isEditing ? (
        <Text style={[styles.intro, { color: colors.textMuted }]}>
          Create a health profile for yourself or a family member. You can add health information and share it
          afterwards.
        </Text>
      ) : null}

      <View style={styles.form}>
        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
        {vm.staleRecord ? <Button title="Load latest version" variant="secondary" onPress={vm.reloadLatest} /> : null}

        <LedgerField
          label="Full name"
          tag="Required"
          placeholder="e.g. Sara Hassan"
          value={vm.name}
          onChangeText={vm.changeName}
          error={vm.nameError}
          autoCapitalize="words"
          autoComplete="off"
        />
        <DateField
          label="Date of birth"
          tag="Required"
          hint="For example 1980-05-31."
          value={vm.dateOfBirth}
          onChangeText={vm.changeDateOfBirth}
          error={vm.dateError}
        />
      </View>

      <Dock>
        <Button title={vm.isEditing ? 'Save changes' : 'Create profile'} loading={vm.saving} onPress={save} />
        <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={() => router.back()} />
      </Dock>
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 15, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 12 },
  form: { paddingHorizontal: 16, gap: 16 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
