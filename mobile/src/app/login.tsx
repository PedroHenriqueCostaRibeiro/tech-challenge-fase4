import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/services/api';
import { colors, radius, spacing, typography } from '@/theme';
import { hasErrors, validateLogin } from '@/utils/validation';

/**
 * Login de professores e alunos.
 * Ao entrar, a rota "login" deixa de existir (Stack.Protected) e o app volta para a tela anterior.
 */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const validation = validateLogin(email, password);
    setErrors(validation);
    setFormError(null);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setFormError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="school" size={40} color={colors.textOnPrimary} />
          </View>
          <Text style={typography.title} accessibilityRole="header">
            EduBlog
          </Text>
          <Text style={[typography.caption, styles.centerText]}>
            Entre com o e-mail e a senha cadastrados pela escola.
          </Text>
        </View>

        {formError && (
          <View style={styles.alert} accessibilityLiveRegion="assertive">
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.alertText}>{formError}</Text>
          </View>
        )}

        <TextField
          label="E-mail"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrors((e) => ({ ...e, email: undefined }));
          }}
          error={errors.email}
          placeholder="seu.email@edublog.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Senha"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors((e) => ({ ...e, password: undefined }));
          }}
          error={errors.password}
          placeholder="Sua senha"
          password
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <Button title="Entrar" icon="log-in-outline" onPress={handleSubmit} loading={isSubmitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.xl, gap: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  brand: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: { textAlign: 'center' },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  alertText: { color: colors.danger, fontWeight: '600', flex: 1 },
});
