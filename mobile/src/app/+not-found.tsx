import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyView } from '@/components/StateViews';
import { spacing } from '@/theme';

/** Rota inexistente ou sem permissão de acesso. */
export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <EmptyView
        icon="compass-outline"
        title="Página não encontrada"
        message="Esta página não existe ou você não tem permissão para acessá-la."
      />
      <Button title="Ir para o início" icon="home-outline" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
});
