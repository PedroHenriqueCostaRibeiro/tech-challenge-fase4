import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import type { Role } from '@/types';

export function RoleBadge({ role }: { role: Role }) {
  const isTeacher = role === 'teacher';
  return (
    <View style={[styles.badge, { backgroundColor: isTeacher ? colors.primarySoft : colors.accentSoft }]}>
      <Text style={[styles.text, { color: isTeacher ? colors.primary : '#92400E' }]}>
        {isTeacher ? 'Professor(a)' : 'Aluno(a)'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: { fontSize: 12, fontWeight: '700' },
});
