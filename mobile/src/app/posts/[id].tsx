import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/contexts/AuthContext';
import { CommentsSection } from '@/features/posts/CommentsSection';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getErrorMessage } from '@/services/api';
import { postsService } from '@/services/posts.service';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import type { Post } from '@/types';
import { confirmAction, notify } from '@/utils/feedback';
import { formatDate } from '@/utils/format';

/** Página de leitura: conteúdo completo do post e comentários. */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const router = useRouter();
  const { isTeacher } = useAuth();

  const fetchPost = useCallback(() => postsService.get(postId), [postId]);
  const { data: post, isLoading, error, reload, refresh } = useAsyncData<Post>(fetchPost);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ao voltar da tela de edição, mostra a versão atualizada.
  useRefreshOnFocus(refresh);

  async function handleDelete() {
    if (!post) return;
    const confirmed = await confirmAction({
      title: 'Excluir post',
      message: `Tem certeza que deseja excluir “${post.title}”?`,
      confirmText: 'Excluir',
      destructive: true,
    });
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await postsService.remove(post.id);
      notify('Post excluído');
      router.back();
    } catch (err) {
      notify('Não foi possível excluir', getErrorMessage(err));
      setIsDeleting(false);
    }
  }

  if (isLoading) return <LoadingView message="Carregando post..." />;
  if (error || !post) return <ErrorView message={error ?? 'Post não encontrado'} onRetry={reload} />;

  const wasEdited = post.updatedAt !== post.createdAt;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.article}>
          <Text style={typography.title} accessibilityRole="header">
            {post.title}
          </Text>
          <View style={styles.meta}>
            <Ionicons name="person-outline" size={16} color={colors.textMuted} />
            <Text style={typography.caption}>{post.author}</Text>
            <Text style={typography.caption}>•</Text>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={typography.caption}>{formatDate(post.createdAt)}</Text>
            {wasEdited && <Text style={typography.caption}>(editado em {formatDate(post.updatedAt)})</Text>}
          </View>
          <View style={styles.divider} />
          <Text style={typography.body} selectable>
            {post.content}
          </Text>
        </View>

        {isTeacher && (
          <View style={styles.actions}>
            <Button
              title="Editar"
              icon="create-outline"
              variant="secondary"
              onPress={() => router.push(`/posts/edit/${post.id}`)}
              style={styles.flex}
            />
            <Button
              title="Excluir"
              icon="trash-outline"
              variant="danger"
              onPress={handleDelete}
              loading={isDeleting}
              style={styles.flex}
            />
          </View>
        )}

        <CommentsSection postId={post.id} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  article: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.card,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  divider: { height: 1, backgroundColor: colors.border },
  actions: { flexDirection: 'row', gap: spacing.md },
});
