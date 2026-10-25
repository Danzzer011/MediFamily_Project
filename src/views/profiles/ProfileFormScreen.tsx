import { router, Stack } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { useThemeColors } from '../../theme';
import { useProfileFormViewModel } from '../../viewmodels/profiles/useProfileFormViewModel';

// Create or edit a family profile (FR01). With a profileId it edits, without one it creates.
export default function ProfileFormScreen({ profileId }: { profileId?: string }) {
  const colors = useThemeColors();
  const vm = useProfileFormViewModel(profileId);
  const dateRef = useRef<TextInput>(null);
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
    <Screen>
      <Stack.Screen options={{ title }} />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {!vm.isEditing ? (
          <Text style={[styles.intro, { color: colors.textMuted }]}>
            Create a health profile for yourself or a family member. You can add health information and share it
            afterwards.
          </Text>
        ) : null}

        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
        {vm.staleRecord ? <Button title="Load latest version" variant="secondary" onPress={vm.reloadLatest} /> : null}

        <TextField
          label="Full name"
          placeholder="e.g. Sara Hassan"
          value={vm.name}
          onChangeText={vm.changeName}
          error={vm.nameError}
          autoCapitalize="words"
          autoComplete="off"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => dateRef.current?.focus()}
        />
        <TextField
          ref={dateRef}
          label="Date of birth"
          placeholder="YYYY-MM-DD"
          hint="For example 1980-05-31."
          value={vm.dateOfBirth}
          onChangeText={vm.changeDateOfBirth}
          error={vm.dateError}
          keyboardType="numbers-and-punctuation"
          autoComplete="off"
          maxLength={10}
          returnKeyType="done"
          onSubmitEditing={save}
        />

        <Button title={vm.isEditing ? 'Save changes' : 'Create profile'} loading={vm.saving} onPress={save} />
        <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={() => router.back()} />
      </View>

      <DemoDataNotice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 16 },
  intro: { fontSize: 15, lineHeight: 21 },
});
