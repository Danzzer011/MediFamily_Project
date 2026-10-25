import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AttachmentPreview from '../../components/AttachmentPreview';
import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import DateColumn from '../../components/ledger/DateColumn';
import HeaderBack from '../../components/ledger/HeaderBack';
import HeaderCancel from '../../components/ledger/HeaderCancel';
import Icon, { type IconName } from '../../components/ledger/Icon';
import LedgerField from '../../components/ledger/LedgerField';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import Pill from '../../components/ledger/Pill';
import SectionLabel from '../../components/ledger/SectionLabel';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
import { datePartsIso } from '../../models/dateTime';
import { formatIsoDate } from '../../models/dates';
import { DOCUMENT_CATEGORIES, isPdf, type MedicalDocument } from '../../models/MedicalDocument';
import { labelFor } from '../../models/text';
import { useThemeColors } from '../../theme';
import { monoFont } from '../../theme/medifamily-theme';
import { useDocumentsViewModel } from '../../viewmodels/documents/useDocumentsViewModel';

// Medical Documents page (FR07): the selected profile's documents, with add, open, edit details and delete.
export default function DocumentsScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useDocumentsViewModel(profileId);

  // the header shows the page name while loading, on an error and in the list
  const pageTitle = <Stack.Screen options={{ title: 'Medical documents' }} />;

  if (vm.loading) {
    return (
      <>
        {pageTitle}
        <LoadingView message="Loading documents…" />
      </>
    );
  }
  if (vm.loadError || !vm.profile) {
    return (
      <>
        {pageTitle}
        <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />
      </>
    );
  }
  const profile = vm.profile;

  const deleteDialog = (
    <ConfirmDialog
      visible={vm.pendingDelete !== null}
      title="Delete this document?"
      message={`“${vm.pendingDelete?.title ?? ''}” (${vm.pendingDelete?.originalFileName ?? ''}) will be deleted for ${profile.name}. This cannot be undone.`}
      confirmTitle="Delete"
      destructive
      loading={vm.deleting}
      error={vm.deleteError}
      onConfirm={vm.confirmDelete}
      onCancel={vm.cancelDelete}
    />
  );

  // ---- add form, or edit details (no file picker when editing) ----
  if (vm.mode === 'add' || vm.mode === 'edit') {
    const adding = vm.mode === 'add';
    const doc = vm.selected;
    return (
      <LedgerScreen>
        <Stack.Screen options={{ title: profile.name, headerBackVisible: false, headerLeft: () => <HeaderCancel onPress={vm.cancelForm} /> }} />
        <PageTitle text={adding ? 'New document' : 'Edit document'} />
        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
        <View style={styles.form}>
          <View style={styles.block}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>File</Text>
              {adding ? <Text style={[styles.tag, { color: colors.textMuted }]}>Required</Text> : null}
            </View>
            {adding ? (
              <>
                <View style={styles.options}>
                  <OptionButton icon="camera" label="Take photo" onPress={() => vm.pickFile('camera')} />
                  <OptionButton icon="upload" label="Choose file" onPress={vm.toggleChoosingKind} />
                </View>
                {vm.choosingKind ? (
                  <View style={styles.options}>
                    <OptionButton icon="image" label="Image" onPress={() => vm.pickFile('image')} />
                    <OptionButton icon="pdf" label="PDF" onPress={() => vm.pickFile('pdf')} />
                  </View>
                ) : null}
                {vm.file ? <FileLine name={vm.file.fileName} type={fileTypeOf(vm.file)} onChange={vm.clearFile} /> : null}
                {vm.errors.file ? <Text style={[styles.error, { color: colors.danger }]}>{vm.errors.file}</Text> : null}
                <Text style={[styles.hint, { color: colors.textMuted }]}>A photo, an image or a PDF.</Text>
              </>
            ) : doc ? (
              <>
                <FileLine name={doc.originalFileName} type={fileTypeOf(doc)} />
                <Text style={[styles.hint, { color: colors.textMuted }]}>The file cannot be changed. Only the details below.</Text>
              </>
            ) : null}
          </View>

          <LedgerField label="Title" tag="Required" value={vm.title} onChangeText={vm.setTitle} error={vm.errors.title} />

          <View style={styles.block}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              <Text style={[styles.tag, { color: colors.textMuted }]}>Required</Text>
            </View>
            <View accessibilityRole="radiogroup" style={styles.chips}>
              {DOCUMENT_CATEGORIES.map((c) => (
                <ChoiceChip key={c} label={labelFor(c)} selected={vm.category === c} onPress={() => vm.setCategory(c)} />
              ))}
            </View>
            {vm.errors.category ? <Text style={[styles.error, { color: colors.danger }]}>{vm.errors.category}</Text> : null}
          </View>

          <LedgerField
            label="Relevant date"
            tag="Required"
            mono
            value={vm.date}
            onChangeText={vm.setDate}
            error={vm.errors.date}
            placeholder="YYYY-MM-DD"
            hint="The date the document is about, like the test or visit date."
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={[styles.dock, { borderColor: colors.border }]}>
          <Button title={adding ? 'Save document' : 'Save changes'} loading={vm.saving} onPress={vm.save} />
          {!adding && doc ? (
            <View style={styles.deleteGap}>
              <Button title="Delete document" variant="danger" disabled={vm.saving} onPress={() => vm.askToDelete(doc)} />
            </View>
          ) : null}
        </View>
        {deleteDialog}
      </LedgerScreen>
    );
  }

  // ---- open one document ----
  if (vm.mode === 'view' && vm.selected) {
    const d = vm.selected;
    return (
      <LedgerScreen>
        <Stack.Screen
          options={{ title: profile.name, headerBackVisible: false, headerLeft: () => <HeaderBack label="Back to documents" onPress={vm.backToList} /> }}
        />
        <PageTitle text={d.title} />
        <View style={styles.previewWrap}>
          {hasRealFile(d) ? (
            <AttachmentPreview file={{ uri: d.storagePath, fileName: d.originalFileName, mimeType: d.mimeType }} />
          ) : (
            <View style={[styles.preview, { borderColor: colors.border, backgroundColor: colors.notice }]}>
              <Icon name={fileTypeOf(d)} size={44} color={colors.textMuted} />
              <Text style={[styles.previewText, { color: colors.textMuted }]}>
                {isPdf(d) ? 'PDF document. No preview for this sample.' : 'Photo preview'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.detailsGap}>
          <LedgerList>
            <Detail label="Category">
              <Pill label={labelFor(d.category)} color={colors.textMuted} borderColor={colors.textMuted} />
            </Detail>
            <Detail label="Relevant date">
              <Text style={[styles.value, { color: colors.text, fontFamily: monoFont }]}>{formatIsoDate(d.relevantDate)}</Text>
            </Detail>
            <Detail label="File name">
              <Text style={[styles.value, { color: colors.text }]}>{d.originalFileName}</Text>
            </Detail>
            <Detail label="File type">
              <FileType type={fileTypeOf(d)} />
            </Detail>
          </LedgerList>
        </View>
        <View style={[styles.dock, { borderColor: colors.border }]}>
          <Button title="Edit details" onPress={() => vm.startEditing(d)} />
          <View style={styles.deleteGap}>
            <Button title="Delete document" variant="danger" onPress={() => vm.askToDelete(d)} />
          </View>
        </View>
        <View style={styles.demoNotice}>
          <DemoDataNotice />
        </View>
        {deleteDialog}
      </LedgerScreen>
    );
  }

  // ---- list ----
  return (
    <LedgerScreen>
      <Stack.Screen options={{ title: 'Medical documents', headerBackVisible: true, headerLeft: undefined }} />
      <PageTitle text="Medical documents" />
      {vm.documents.length > 0 ? (
        <>
          <SectionLabel label="Newest first" count={vm.documents.length} />
          <LedgerList>
            {vm.documents.map((d) => (
              <DocumentRow key={d.id} doc={d} onOpen={() => vm.openDocument(d)} />
            ))}
          </LedgerList>
          <View style={[styles.dock, { borderColor: colors.border }]}>
            <Button title="Add document" onPress={vm.startAdding} />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: colors.text }]}>{`No documents for ${profile.name} yet.`}</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Keep prescriptions, lab reports and scans here. Take a photo or choose a file.</Text>
          <Button title="Add the first document" onPress={vm.startAdding} />
        </View>
      )}
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

// One document: its date, title, category, file type and file name.
function DocumentRow({ doc, onOpen }: { doc: MedicalDocument; onOpen: () => void }) {
  const colors = useThemeColors();
  const p = datePartsIso(doc.relevantDate);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${doc.title}`} onPress={onOpen} style={styles.row}>
      <DateColumn top={`${p.day} ${p.month}`} bottom={p.year} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{doc.title}</Text>
        <View style={styles.chipsRow}>
          <Pill label={labelFor(doc.category)} color={colors.textMuted} borderColor={colors.textMuted} />
          <FileType type={fileTypeOf(doc)} small />
        </View>
        <Text style={[styles.small, { color: colors.textMuted }]}>{doc.originalFileName}</Text>
      </View>
      <Icon name="next" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

// Image or PDF, read from the file's mime type.
function fileTypeOf(file: { mimeType: string }): 'image' | 'pdf' {
  return isPdf(file) ? 'pdf' : 'image';
}

// Files picked on this device have a real address. The demo documents do not, so they show no preview.
function hasRealFile(doc: MedicalDocument): boolean {
  return /^(file|content|blob|data|https?):/.test(doc.storagePath);
}

// An image or PDF icon with its label.
function FileType({ type, small = false }: { type: 'image' | 'pdf'; small?: boolean }) {
  const colors = useThemeColors();
  return (
    <View style={styles.fileType}>
      <Icon name={type} size={small ? 14 : 16} color={colors.primary} />
      <Text style={[small ? styles.fileTypeSmall : styles.value, { color: colors.primary, fontWeight: '700' }]}>{type === 'pdf' ? 'PDF' : 'Image'}</Text>
    </View>
  );
}

// The attached file, as a boxed line. "Change" clears it so another can be chosen.
function FileLine({ name, type, onChange }: { name: string; type: 'image' | 'pdf'; onChange?: () => void }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.fileLine, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Icon name={type} size={22} color={colors.primary} />
      <View style={styles.fileText}>
        <Text style={[styles.fileName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>{type === 'pdf' ? 'PDF' : 'Image'}</Text>
      </View>
      {onChange ? <LinkAction label="Change" accessibilityLabel={`Remove ${name} and choose another file`} onPress={onChange} /> : null}
    </View>
  );
}

// Take photo / Choose file: the team's outlined-button look, with an icon.
function OptionButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.option, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={[styles.optionText, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={styles.detail}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.detailValue}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  rowBody: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 4 },
  small: { fontSize: 14, lineHeight: 20 },
  fileType: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fileTypeSmall: { fontSize: 13 },
  value: { fontSize: 16, lineHeight: 22 },
  dock: { marginTop: 20, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  deleteGap: { marginTop: 16 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
  empty: { paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  emptyTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  emptyText: { fontSize: 16, lineHeight: 22, marginBottom: 10 },
  form: { paddingHorizontal: 16, gap: 14 },
  block: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 15, fontWeight: '600' },
  tag: { fontSize: 13 },
  hint: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  options: { flexDirection: 'row', gap: 12 },
  option: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12 },
  optionText: { fontSize: 16, fontWeight: '700' },
  fileLine: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, paddingVertical: 6, paddingLeft: 14, paddingRight: 8, borderWidth: 1.5, borderRadius: 12 },
  fileText: { flex: 1, minWidth: 0 },
  fileName: { fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewWrap: { paddingHorizontal: 16 },
  preview: { height: 210, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12 },
  previewText: { fontSize: 14 },
  detailsGap: { marginTop: 16 },
  detail: { paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
  detailLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  detailValue: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
});
