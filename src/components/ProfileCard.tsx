import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatIsoDate } from '../models/dates';
import type { ProfileSummary } from '../models/FamilyProfile';
import { useThemeColors } from '../theme';

// props: the profile to show. Tapping it calls onPress (the page opens the profile).
export default function ProfileCard({ profile, onPress }: { profile: ProfileSummary; onPress: () => void }) {
  const colors = useThemeColors();
  const initial = profile.name.trim().charAt(0).toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${profile.name}'s profile`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.avatar, { backgroundColor: colors.notice }]}>
        <Text style={[styles.initial, { color: colors.primary }]}>{initial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{profile.name}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>Born {formatIsoDate(profile.dateOfBirth)}</Text>
      </View>
      <Text style={[styles.badge, { color: colors.primary, borderColor: colors.primary }]}>
        {profile.isCreator ? 'Creator' : 'Shared'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderRadius: 16 },
  pressed: { opacity: 0.8 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700' },
  meta: { fontSize: 14, marginTop: 2 },
  badge: { fontSize: 12, fontWeight: '700', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
});
