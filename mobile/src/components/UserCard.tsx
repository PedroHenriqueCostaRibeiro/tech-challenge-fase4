import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import type { User } from '@/types';
import { Avatar } from './Avatar';
import { Button } from './Button';

interface UserCardProps {
  user: User;
  /** Rótulo e valor do campo extra (Disciplina ou Matrícula). */
  extraLabel: string;
  extraValue: string | null;
  isCurrentUser?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

/** Linha da "tabela" de professores/alunos com os botões Editar e Excluir. */
export function UserCard({
  user,
  extraLabel,
  extraValue,
  isCurrentUser = false,
  onEdit,
  onDelete,
  deleting = false,
}: UserCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Avatar name={user.name} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
            {isCurrentUser ? ' (você)' : ''}
          </Text>
          <Text style={typography.caption} numberOfLines={1}>
            {user.email}
          </Text>
          <Text style={typography.caption}>
            {extraLabel}: {extraValue || '—'}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          title="Editar"
          icon="create-outline"
          size="sm"
          variant="secondary"
          onPress={onEdit}
          accessibilityLabel={`Editar ${user.name}`}
        />
        <Button
          title="Excluir"
          icon="trash-outline"
          size="sm"
          variant="danger"
          onPress={onDelete}
          loading={deleting}
          disabled={isCurrentUser}
          accessibilityLabel={`Excluir ${user.name}`}
          accessibilityHint={isCurrentUser ? 'Você não pode excluir a sua própria conta' : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
