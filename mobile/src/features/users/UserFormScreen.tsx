import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { ApiError, getErrorMessage } from '@/services/api';
import { usersService } from '@/services/users.service';
import { colors, radius, spacing, typography } from '@/theme';
import type { Role, UserInput } from '@/types';
import { notify } from '@/utils/feedback';
import { fromApiErrors, hasErrors, validateUser, type FormErrors } from '@/utils/validation';
import { capitalize, ROLE_CONFIG } from './roles';

interface UserFormScreenProps {
  role: Role;
  /** Sem id = cadastro; com id = edição. */
  userId?: number;
}

const EMPTY: UserInput = { name: '', email: '', password: '', subject: '', registration: '' };

/** Formulário de cadastro/edição de professores e alunos. */
export function UserFormScreen({ role, userId }: UserFormScreenProps) {
  const config = ROLE_CONFIG[role];
  const isEdit = userId !== undefined;
  const router = useRouter();
  const { user: currentUser, refreshUser } = useAuth();

  const [form, setForm] = useState<UserInput>(EMPTY);
  const [errors, setErrors] = useState<FormErrors<UserInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edição: carrega os dados atuais e preenche o formulário (senha fica em branco).
  const fetchUser = useCallback(async () => {
    const user = await usersService(role).get(userId!);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      subject: user.subject ?? '',
      registration: user.registration ?? '',
    });
    return user;
  }, [role, userId]);
  const { isLoading, error: loadError, reload } = useAsyncData(fetchUser, { enabled: isEdit });

  function update<K extends keyof UserInput>(field: K, value: UserInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit() {
    const validation = validateUser(form, isEdit ? 'edit' : 'create');
    setErrors(validation);
    setFormError(null);
    if (hasErrors(validation)) return;

    const payload: UserInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      [config.extraField]: (form[config.extraField] ?? '').trim(),
    };

    setIsSaving(true);
    try {
      if (isEdit) {
        await usersService(role).update(userId, payload);
        if (userId === currentUser?.id) await refreshUser();
        notify(`${capitalize(config.singular)} atualizado`, 'As alterações foram salvas.');
      } else {
        await usersService(role).create(payload);
        notify(`${capitalize(config.singular)} cadastrado`, `${payload.name} já pode entrar no app.`);
      }
      router.back();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setErrors(fromApiErrors<UserInput>(err.fieldErrors));
      }
      setFormError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  const title = isEdit ? `Editar ${config.singular}` : `Novo ${config.singular}`;

  if (isLoading) return <LoadingView />;
  if (loadError) return <ErrorView message={loadError} onRetry={reload} />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.caption}>
          {isEdit
            ? 'Altere os dados e toque em "Salvar alterações".'
            : `Preencha os dados para cadastrar ${config.article} ${config.singular}. Ele(a) poderá entrar no app com este e-mail e senha.`}
        </Text>

        {formError && (
          <View style={styles.alert} accessibilityLiveRegion="assertive">
            <Text style={styles.alertText}>{formError}</Text>
          </View>
        )}

        <TextField
          label="Nome completo"
          value={form.name}
          onChangeText={(text) => update('name', text)}
          error={errors.name}
          placeholder="Ex.: Maria da Silva"
          autoCapitalize="words"
        />
        <TextField
          label="E-mail"
          value={form.email}
          onChangeText={(text) => update('email', text)}
          error={errors.email}
          placeholder="nome@edublog.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label={config.extraLabel}
          value={form[config.extraField] ?? ''}
          onChangeText={(text) => update(config.extraField, text)}
          error={errors[config.extraField]}
          placeholder={config.extraPlaceholder}
        />
        <TextField
          label={isEdit ? 'Nova senha (opcional)' : 'Senha'}
          value={form.password}
          onChangeText={(text) => update('password', text)}
          error={errors.password}
          hint={isEdit ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 6 caracteres.'}
          password
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.actions}>
          <Button title="Cancelar" variant="secondary" onPress={() => router.back()} style={styles.flex} />
          <Button
            title={isEdit ? 'Salvar alterações' : 'Cadastrar'}
            icon={isEdit ? 'save-outline' : 'person-add-outline'}
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
