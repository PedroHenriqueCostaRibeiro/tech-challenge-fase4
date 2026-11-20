import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { LoadingView } from '@/components/StateViews';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme';

/**
 * Navegação raiz. As rotas protegidas só existem quando a condição (guard) é verdadeira:
 *  - login: apenas para visitantes;
 *  - criação/edição de posts, professores e alunos: apenas para professores logados.
 * Se alguém tentar abrir uma rota protegida sem permissão, o Expo Router redireciona.
 */
function RootNavigator() {
  const { isLoading, isAuthenticated, isTeacher } = useAuth();

  // Só monta as rotas depois de restaurar a sessão salva. Assim, abrir/atualizar
  // uma rota protegida (ex.: /admin) não redireciona antes de sabermos quem é o usuário.
  if (isLoading) {
    return <LoadingView message="Abrindo o EduBlog..." />;
  }

  return (
    <View style={styles.flex}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textOnPrimary,
          headerTitleStyle: { fontWeight: '700' },
          headerBackTitle: 'Voltar',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="posts/[id]" options={{ title: 'Post' }} />

        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" options={{ title: 'Entrar', presentation: 'modal' }} />
        </Stack.Protected>

        <Stack.Protected guard={isTeacher}>
          <Stack.Screen name="posts/create" options={{ title: 'Novo post' }} />
          <Stack.Screen name="posts/edit/[id]" options={{ title: 'Editar post' }} />
          <Stack.Screen name="teachers/create" options={{ title: 'Novo professor' }} />
          <Stack.Screen name="teachers/edit/[id]" options={{ title: 'Editar professor' }} />
          <Stack.Screen name="students/create" options={{ title: 'Novo aluno' }} />
          <Stack.Screen name="students/edit/[id]" options={{ title: 'Editar aluno' }} />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
});
