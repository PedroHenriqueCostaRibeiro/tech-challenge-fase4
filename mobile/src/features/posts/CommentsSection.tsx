import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getErrorMessage } from '@/services/api';
import { postsService } from '@/services/posts.service';
import { colors, MIN_TOUCH, radius, spacing, typography } from '@/theme';
import type { Comment } from '@/types';
import { confirmAction, notify } from '@/utils/feedback';
import { formatDate } from '@/utils/format';

/** Comentários do post: qualquer pessoa lê; usuários logados comentam. */
export function CommentsSection({ postId }: { postId: number }) {
  const router = useRouter();
  const { user, isTeacher } = useAuth();
  const fetchComments = useCallback(() => postsService.listComments(postId), [postId]);
  const { data, setData, isLoading, error, reload } = useAsyncData<Comment[]>(fetchComments);
  const comments = data ?? [];
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const setComments = (update: (current: Comment[]) => Comment[]) =>
    setData((current) => update(current ?? []));

  async function handleSend() {
    const content = text.trim();
    if (content.length < 2) {
      notify('Comentário muito curto', 'Escreva ao menos 2 caracteres.');
      return;
    }
    setIsSending(true);
    try {
      const created = await postsService.addComment(postId, content);
      setComments((current) => [...current, created]);
      setText('');
    } catch (err) {
      notify('Não foi possível comentar', getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  async function handleDelete(comment: Comment) {
    const confirmed = await confirmAction({
      title: 'Excluir comentário',
      message: 'Deseja excluir este comentário?',
      confirmText: 'Excluir',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await postsService.removeComment(postId, comment.id);
      setComments((current) => current.filter((c) => c.id !== comment.id));
    } catch (err) {
      notify('Não foi possível excluir', getErrorMessage(err));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={typography.subtitle} accessibilityRole="header">
        Comentários {isLoading ? '' : `(${comments.length})`}
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <View style={styles.row}>
          <Text style={[typography.caption, styles.flex]}>{error}</Text>
          <Button title="Tentar de novo" size="sm" variant="secondary" onPress={reload} />
        </View>
      ) : comments.length === 0 ? (
        <Text style={typography.caption}>Ninguém comentou ainda. Seja o primeiro!</Text>
      ) : (
        comments.map((comment) => {
          const canDelete = isTeacher || (user !== null && comment.userId === user.id);
          return (
            <View key={comment.id} style={styles.comment}>
              <Avatar name={comment.authorName} size={36} />
              <View style={styles.flex}>
                <View style={styles.row}>
                  <Text style={styles.author}>{comment.authorName}</Text>
                  <Text style={typography.caption}>{formatDate(comment.createdAt)}</Text>
                </View>
                <Text style={styles.text}>{comment.content}</Text>
              </View>
              {canDelete && (
                <Pressable
                  onPress={() => handleDelete(comment)}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir comentário de ${comment.authorName}`}
                  hitSlop={8}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              )}
            </View>
          );
        })
      )}

      {user ? (
        <View style={styles.form}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escreva um comentário..."
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Escreva um comentário"
            multiline
            maxLength={1000}
            style={styles.input}
          />
          <Button
            title="Comentar"
            icon="send"
            size="sm"
            onPress={handleSend}
            loading={isSending}
            disabled={text.trim().length === 0}
            style={styles.send}
          />
        </View>
      ) : (
        <View style={styles.loginBox}>
          <Text style={typography.caption}>Entre com sua conta para comentar.</Text>
          <Button title="Entrar" icon="log-in-outline" size="sm" variant="secondary" onPress={() => router.push('/login')} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  comment: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  author: { fontWeight: '700', color: colors.text },
  text: { ...typography.body, fontSize: 15, marginTop: 2 },
  deleteButton: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  form: { gap: spacing.sm },
  input: {
    minHeight: MIN_TOUCH * 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  send: { alignSelf: 'flex-end' },
  loginBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
