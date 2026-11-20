import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { ApiError, getErrorMessage } from '@/services/api';
import { postsService } from '@/services/posts.service';
import { colors, radius, spacing, typography } from '@/theme';
import type { PostInput } from '@/types';
import { notify } from '@/utils/feedback';
import { fromApiErrors, hasErrors, validatePost, type FormErrors } from '@/utils/validation';

/** Formulário de criação (sem postId) ou edição (com postId) de posts. */
export function PostFormScreen({ postId }: { postId?: number }) {
  const isEdit = postId !== undefined;
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<PostInput>({ title: '', content: '', author: user?.name ?? '' });
  const [errors, setErrors] = useState<FormErrors<PostInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edição: carrega os dados atuais do post e preenche o formulário.
  const fetchPost = useCallback(async () => {
    const post = await postsService.get(postId!);
    setForm({ title: post.title, content: post.content, author: post.author });
    return post;
  }, [postId]);
  const { isLoading, error: loadError, reload } = useAsyncData(fetchPost, { enabled: isEdit });

  function update(field: keyof PostInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit() {
    const validation = validatePost(form);
    setErrors(validation);
    setFormError(null);
    if (hasErrors(validation)) return;

    const payload: PostInput = {
      title: form.title.trim(),
      content: form.content.trim(),
      author: form.author.trim(),
    };

    setIsSaving(true);
    try {
      if (isEdit) {
        await postsService.update(postId, payload);
        notify('Post atualizado', 'As alterações foram salvas.');
        router.back();
      } else {
        const created = await postsService.create(payload);
        notify('Post publicado', 'O post já está visível para todos.');
        router.replace(`/posts/${created.id}`);
      }
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setErrors(fromApiErrors<PostInput>(err.fieldErrors));
      }
      setFormError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingView message="Carregando post..." />;
  if (loadError) return <ErrorView message={loadError} onRetry={reload} />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: isEdit ? 'Editar post' : 'Novo post' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.caption}>
          {isEdit
            ? 'Altere os campos e toque em "Salvar alterações".'
            : 'Escreva o post e toque em "Publicar". Ele aparecerá para todos os alunos.'}
        </Text>

        {formError && (
          <View style={styles.alert} accessibilityLiveRegion="assertive">
            <Text style={styles.alertText}>{formError}</Text>
          </View>
        )}

        <TextField
          label="Título"
          value={form.title}
          onChangeText={(text) => update('title', text)}
          error={errors.title}
          placeholder="Ex.: Revisão para a prova de Matemática"
          maxLength={150}
        />
        <TextField
          label="Autor"
          value={form.author}
          onChangeText={(text) => update('author', text)}
          error={errors.author}
          placeholder="Nome de quem assina o post"
          autoCapitalize="words"
          maxLength={100}
        />
        <TextField
          label="Conteúdo"
          value={form.content}
          onChangeText={(text) => update('content', text)}
          error={errors.content}
          placeholder="Escreva aqui o conteúdo do post..."
          multiline
          hint={`${form.content.trim().length} caracteres`}
        />

        <View style={styles.actions}>
          <Button title="Cancelar" variant="secondary" onPress={() => router.back()} style={styles.flex} />
          <Button
            title={isEdit ? 'Salvar alterações' : 'Publicar'}
            icon={isEdit ? 'save-outline' : 'send'}
            onPress={handleSubmit}
            loading={isSaving}
            style={styles.flex}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  alert: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md },
  alertText: { color: colors.danger, fontWeight: '600' },
});
