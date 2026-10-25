import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { isPdf, type PickedFile } from '../models/MedicalDocument';
import { useThemeColors } from '../theme';

// Shows an attached file: a photo as a picture, a PDF as its file name.
export default function AttachmentPreview({ file }: { file: PickedFile }) {
  const colors = useThemeColors();

  if (isPdf(file)) {
    return (
      <View style={[styles.pdf, { backgroundColor: colors.notice, borderColor: colors.border }]}>
        <Text style={[styles.pdfLabel, { color: colors.primary }]}>PDF</Text>
        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={2}>
          {file.fileName}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: file.uri }}
      accessibilityLabel={`Attached photo ${file.fileName}`}
      contentFit="contain"
      style={[styles.image, { backgroundColor: colors.notice }]}
    />
  );
}

const styles = StyleSheet.create({
  pdf: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  pdfLabel: { fontSize: 14, fontWeight: '800' },
  fileName: { flex: 1, fontSize: 15 },
  image: { width: '100%', height: 220, borderRadius: 12 },
});
