import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { FloatingButton } from '@/components/FloatingButton';
import { PostCard } from '@/components/PostCard';
import { SearchBar } from '@/components/SearchBar';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { usePosts } from '@/hooks/usePosts';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { colors, spacing, typography } from '@/theme';

/** Página principal: lista de todos os posts com busca por palavras-chave. */
export default function HomeScreen() {
  const router = useRouter();
  const { user, isTeacher } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 400);
  const { posts, total, isLoading, isRefreshing, isLoadingMore, error, refresh, silentRefresh, retry, loadMore } =
    usePosts(debouncedSearch);

  // Ao voltar para a lista (ex.: depois de criar/editar), atualiza sem piscar a tela.
  useRefreshOnFocus(silentRefresh);

  const firstName = user?.name.split(' ')[0];

  const header = (
    <View style={styles.header}>
      <Text style={typography.title} accessibilityRole="header">
        {firstName ? `Olá, ${firstName}!` : 'Bem-vindo(a)!'}
      </Text>
      <Text style={typography.caption}>Conteúdos, avisos e materiais dos professores.</Text>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar posts por palavra-chave" />
      {debouncedSearch !== '' && !isLoading && !error && (
        <Text style={typography.caption} accessibilityLiveRegion="polite">
          {total} {total === 1 ? 'resultado' : 'resultados'} para “{debouncedSearch}”
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={error && posts.length === 0 ? [] : posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => router.push(`/posts/${item.id}`)} />
        )}
        ListEmptyComponent={
          isLoading ? (
            <LoadingView message="Carregando posts..." />
          ) : error ? (
            <ErrorView message={error} onRetry={retry} />
          ) : (
            <EmptyView
              title={debouncedSearch ? 'Nenhum post encontrado' : 'Nenhum post publicado'}
              message={debouncedSearch ? 'Tente outras palavras-chave.' : 'Os posts dos professores aparecerão aqui.'}
            />
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : error && posts.length > 0 ? (
            <Text style={[typography.caption, styles.footer]}>{error}</Text>
          ) : undefined
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      />

      {isTeacher && (
        <FloatingButton icon="add" accessibilityLabel="Criar novo post" onPress={() => router.push('/posts/create')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: 100, flexGrow: 1 },
  header: { gap: spacing.sm, marginBottom: spacing.lg },
  footer: { marginVertical: spacing.lg, textAlign: 'center' },
});
