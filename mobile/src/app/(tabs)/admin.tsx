import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { PostCard } from '@/components/PostCard';
import { SearchBar } from '@/components/SearchBar';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { useDebounce } from '@/hooks/useDebounce';
import { usePosts } from '@/hooks/usePosts';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getErrorMessage } from '@/services/api';
import { postsService } from '@/services/posts.service';
import { colors, spacing, typography } from '@/theme';
import type { Post } from '@/types';
import { confirmAction, notify } from '@/utils/feedback';

/** Página administrativa: todas as postagens com botões de editar e excluir. */
export default function AdminScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 400);
  const {
    posts,
    total,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    silentRefresh,
    retry,
    loadMore,
    removeLocal,
  } = usePosts(debouncedSearch);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useRefreshOnFocus(silentRefresh);

  async function handleDelete(post: Post) {
    const confirmed = await confirmAction({
      title: 'Excluir post',
      message: `Tem certeza que deseja excluir “${post.title}”? Os comentários também serão apagados.`,
      confirmText: 'Excluir',
      destructive: true,
    });
    if (!confirmed) return;

    setDeletingId(post.id);
    try {
      await postsService.remove(post.id);
      removeLocal(post.id);
    } catch (err) {
      notify('Não foi possível excluir', getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text style={typography.title} accessibilityRole="header">
            Postagens
          </Text>
          <Text style={typography.caption}>
            {total} {total === 1 ? 'post' : 'posts'}
            {debouncedSearch ? ` para “${debouncedSearch}”` : ' publicados'}
          </Text>
        </View>
        <Button title="Novo post" icon="add" size="sm" onPress={() => router.push('/posts/create')} />
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar posts para gerenciar" />
    </View>
  );

  return (
    <FlatList
      data={error && posts.length === 0 ? [] : posts}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => router.push(`/posts/${item.id}`)}
          actions={
            <>
              <Button
                title="Editar"
                icon="create-outline"
                size="sm"
                variant="secondary"
                onPress={() => router.push(`/posts/edit/${item.id}`)}
                accessibilityLabel={`Editar ${item.title}`}
              />
              <Button
                title="Excluir"
                icon="trash-outline"
                size="sm"
                variant="danger"
                loading={deletingId === item.id}
                onPress={() => handleDelete(item)}
                accessibilityLabel={`Excluir ${item.title}`}
              />
            </>
          }
        />
      )}
      ListEmptyComponent={
        isLoading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView message={error} onRetry={retry} />
        ) : (
          <EmptyView title="Nenhum post encontrado" message="Toque em “Novo post” para publicar." />
        )
      }
      ListFooterComponent={
        isLoadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : undefined
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  footer: { marginVertical: spacing.lg },
});
