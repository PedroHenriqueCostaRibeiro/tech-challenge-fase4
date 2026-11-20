import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import type { Post } from '@/types';
import { excerpt, formatDate } from '@/utils/format';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  /** Botões extras (ex.: editar/excluir na área administrativa). */
  actions?: ReactNode;
}

/** Item da lista de posts: título, autor, data e uma breve descrição. */
export function PostCard({ post, onPress, actions }: PostCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${post.title}, por ${post.author}`}
        accessibilityHint="Abre o post completo"
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={14} color={colors.textMuted} />
          <Text style={typography.caption}>{post.author}</Text>
          <Text style={typography.caption}>•</Text>
          <Text style={typography.caption}>{formatDate(post.createdAt)}</Text>
        </View>
        <Text style={styles.excerpt} numberOfLines={3}>
          {excerpt(post.content)}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
          <Text style={typography.caption}>
            {post.commentCount} {post.commentCount === 1 ? 'comentário' : 'comentários'}
          </Text>
        </View>
      </Pressable>
      {actions && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  body: { padding: spacing.lg, gap: spacing.sm },
  pressed: { backgroundColor: colors.primarySoft },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  excerpt: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
