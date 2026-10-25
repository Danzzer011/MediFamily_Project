import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
import ProfileName from '../../components/ProfileName';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { formatIsoDate } from '../../models/dates';
import { DOCUMENT_CATEGORIES } from '../../models/MedicalDocument';
import { useThemeColors } from '../../theme';
import { useDocumentsViewModel } from '../../viewmodels/documents/useDocumentsViewModel';

// Medical Documents page (FR07): list of the selected profile's documents, with add, details and edit.
export default function DocumentsScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useDocumentsViewModel(profileId);
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];

  if (vm.loading) return <LoadingView message="Loading documents…" />;
  if (vm.loadError || !vm.profile) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }
  const profile = vm.profile;

  const deleteDialog = (
    <ConfirmDialog
      visible={vm.pendingDelete !== null}
      title="Delete document?"
      message={`“${vm.pendingDelete?.title ?? ''}” will be deleted for ${profile.name}. This cannot be undone.`}
      confirmTitle="Delete"
      destructive
      loading={vm.deleting}
      error={vm.deleteError}
      onConfirm={vm.confirmDelete}
      onCancel={vm.cancelDelete}
    />
  );

  // ---- add / edit form ----
  if (vm.mode === 'add' || vm.mode === 'edit') {
    const adding = vm.mode === 'add';
    return (
      <Screen>
        <Stack.Screen options={{ title: adding ? 'Add document' : 'Edit document' }} />
        <ProfileName name={profile.name} />
        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}

        {adding ? (
          <View style={card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>File</Text>
            <Button title="Take photo" variant="secondary" onPress={vm.takePhoto} />
            <Button title="Choose file (image or PDF)" variant="secondary" onPress={vm.chooseFile} />
            {vm.file ? <FileInfo name={vm.file.fileName} type={vm.file.fileType} /> : null}
            {vm.errors.file ? <Text style={[styles.error, { color: colors.danger }]}>{vm.errors.file}</Text> : null}
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              Demo only: these buttons attach a sample file. The real camera and file picker come in Phase 2.
            </Text>
          </View>
        ) : vm.selected ? (
          <View style={card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>File</Text>
            <FileInfo name={vm.selected.fileName} type={vm.selected.fileType} />
            <Text style={[styles.muted, { color: colors.textMuted }]}>Only the details can be edited, not the file.</Text>
          </View>
        ) : null}

        <View style={card}>
          <TextField label="Title" value={vm.title} onChangeText={vm.setTitle} error={vm.errors.title} />
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {DOCUMENT_CATEGORIES.map((c) => (
              <ChoiceChip key={c} label={capitalize(c)} selected={vm.category === c} onPress={() => vm.setCategory(c)} />
            ))}
          </View>
          {vm.errors.category ? <Text style={[styles.error, { color: colors.danger }]}>{vm.errors.category}</Text> : null}
          <TextField
            label="Relevant date"
            value={vm.date}
            onChangeText={vm.setDate}
            error={vm.errors.date}
            placeholder="YYYY-MM-DD"
            hint="The date the document is about, e.g. the test or visit date."
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <Button title={adding ? 'Save document' : 'Save details'} loading={vm.saving} onPress={vm.save} />
        <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={vm.backToList} />
        <DemoDataNotice />
      </Screen>
    );
  }

  // ---- details of one document ----
  if (vm.mode === 'view' && vm.selected) {
    const d = vm.selected;
    return (
      <Screen>
        <Stack.Screen options={{ title: d.title }} />
        <ProfileName name={profile.name} />
        <View style={card}>
          <Detail label="Title" value={d.title} />
          <Detail label="Category" value={capitalize(d.category)} />
          <Detail label="Relevant date" value={formatIsoDate(d.relevantDate)} />
          <Detail label="File name" value={d.fileName} />
          <Detail label="File type" value={d.fileType === 'pdf' ? 'PDF' : 'Image'} />
        </View>
        <Text style={[styles.muted, { color: colors.textMuted }]}>Phase 1 demo: the file itself is not stored, only these details.</Text>
        <Button title="Edit details" onPress={() => vm.startEditing(d)} />
        <Button title="Delete document" variant="danger" onPress={() => vm.askToDelete(d)} />
        <Button title="Back to list" variant="secondary" onPress={vm.backToList} />
        <DemoDataNotice />
        {deleteDialog}
      </Screen>
    );
  }

  // ---- list ----
  return (
    <Screen>
      <Stack.Screen options={{ title: `${profile.name} · Documents` }} />
      <ProfileName name={profile.name} />
      <Button title="Add document" onPress={vm.startAdding} />

      {vm.documents.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textMuted }]}>No documents yet.</Text>
      ) : (
        vm.documents.map((d) => (
          <View key={d.id} style={card}>
            <View style={styles.rowTop}>
              <Text style={[styles.sectionTitle, styles.flex, { color: colors.text }]}>{d.title}</Text>
              <Text style={[styles.badge, { color: colors.primary, borderColor: colors.primary }]}>{capitalize(d.category)}</Text>
            </View>
            <Text style={[styles.body, { color: colors.text }]}>{formatIsoDate(d.relevantDate)}</Text>
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              {d.fileName} · {d.fileType === 'pdf' ? 'PDF' : 'Image'}
            </Text>
            <View style={styles.actions}>
              <LinkAction label="Open" accessibilityLabel={`Open ${d.title}`} onPress={() => vm.openDocument(d)} />
              <LinkAction label="Edit" accessibilityLabel={`Edit ${d.title}`} onPress={() => vm.startEditing(d)} />
              <LinkAction label="Delete" danger accessibilityLabel={`Delete ${d.title}`} onPress={() => vm.askToDelete(d)} />
            </View>
          </View>
        ))
      )}

      <DemoDataNotice />
      {deleteDialog}
    </Screen>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "File name: x.pdf · PDF" line used in the form.
function FileInfo({ name, type }: { name: string; type: string }) {
  const colors = useThemeColors();
  return (
    <Text style={[styles.body, { color: colors.text }]}>
      {name} · {type === 'pdf' ? 'PDF' : 'Image'}
    </Text>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.detail}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.body, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22 },
  muted: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 13 },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 13, fontWeight: '700', borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  actions: { flexDirection: 'row', gap: 16 },
  detail: { gap: 2 },
});
