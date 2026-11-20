import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button, type IconName } from '@/components/Button';
import { RoleBadge } from '@/components/RoleBadge';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/services/config';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { confirmAction } from '@/utils/feedback';

function Permission({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.permission}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[typography.body, styles.flex]}>{text}</Text>
    </View>
  );
}

/** Aba "Conta": perfil do usuário logado ou convite para entrar. */
export default function AccountScreen() {
  const router = useRouter();
  const { user, isTeacher, signOut } = useAuth();

  async function handleSignOut() {
    const confirmed = await confirmAction({
      title: 'Sair',
      message: 'Deseja sair da sua conta?',
      confirmText: 'Sair',
    });
    if (confirmed) await signOut();
  }

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, styles.center]}>
          <Ionicons name="person-circle-outline" size={72} color={colors.primary} />
          <Text style={typography.subtitle}>Você está como visitante</Text>
          <Text style={[typography.caption, styles.centerText]}>
            Visitantes e alunos podem ler os posts. Entre com sua conta para comentar — e, se você for
            professor(a), para publicar e administrar o conteúdo.
          </Text>
          <Button title="Entrar" icon="log-in-outline" onPress={() => router.push('/login')} style={styles.fullWidth} />
        </View>
        <Text style={[typography.caption, styles.centerText]}>API: {API_URL}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.card, styles.center]}>
        <Avatar name={user.name} size={80} />
        <Text style={typography.title}>{user.name}</Text>
        <Text style={typography.caption}>{user.email}</Text>
        <RoleBadge role={user.role} />
        {user.subject && <Text style={typography.body}>Disciplina: {user.subject}</Text>}
        {user.registration && <Text style={typography.body}>Matrícula: {user.registration}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={typography.subtitle} accessibilityRole="header">
          O que você pode fazer
        </Text>
        <Permission icon="book-outline" text="Ler todos os posts e buscar por palavras-chave" />
        <Permission icon="chatbubbles-outline" text="Comentar nos posts" />
        {isTeacher ? (
          <>
            <Permission icon="create-outline" text="Criar, editar e excluir posts" />
            <Permission icon="school-outline" text="Cadastrar, editar e excluir professores" />
            <Permission icon="people-outline" text="Cadastrar, editar e excluir alunos" />
          </>
        ) : (
          <Permission icon="lock-closed-outline" text="Criar e editar posts é exclusivo dos professores" />
        )}
      </View>

      {isTeacher && (
        <Button title="Escrever um post" icon="add" onPress={() => router.push('/posts/create')} />
      )}
      <Button title="Sair" icon="log-out-outline" variant="danger" onPress={handleSignOut} />
      <Text style={[typography.caption, styles.centerText]}>API: {API_URL}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.card,
  },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  permission: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
