import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Pagination } from '@/components/Pagination';
import { SearchBar } from '@/components/SearchBar';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { UserCard } from '@/components/UserCard';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useUsers } from '@/hooks/useUsers';
import { getErrorMessage } from '@/services/api';
import { usersService } from '@/services/users.service';
import { colors, spacing, typography } from '@/theme';
import type { Role, User } from '@/types';
import { confirmAction, notify } from '@/utils/feedback';
import { capitalize, ROLE_CONFIG } from './roles';

/** Listagem paginada de professores ou alunos, com botões Editar e Excluir. */
export function UserListScreen({ role }: { role: Role }) {
  const config = ROLE_CONFIG[role];
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 400);
  const { users, meta, page, setPage, isLoading, error, reload, retry } = useUsers(role, debouncedSearch);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useRefreshOnFocus(reload);

  async function handleDelete(target: User) {
    const confirmed = await confirmAction({
      title: `Excluir ${config.singular}`,
      message: `Tem certeza que deseja excluir ${target.name}? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      destructive: true,
    });
    if (!confirmed) return;

    setDeletingId(target.id);
    try {
      await usersService(role).remove(target.id);
      await reload();
    } catch (err) {
      notify('Não foi possível excluir', getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          <Text style={typography.title} accessibilityRole="header">
            {capitalize(config.plural)}
          </Text>
          <Text style={typography.caption}>
            {meta.total === 1
              ? `1 ${config.singular} cadastrado`
              : `${meta.total} ${config.plural} cadastrados`}
          </Text>
        </View>
        <Button
          title="Novo"
          icon="add"
          size="sm"
          onPress={() => router.push(`${config.basePath}/create`)}
          accessibilityLabel={`Cadastrar novo ${config.singular}`}
        />
      </View>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={`Buscar ${config.plural} por nome, e-mail ou ${config.extraLabel.toLowerCase()}`}
      />
    </View>
  );

  return (
    <FlatList
      data={error ? [] : users}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      renderItem={({ item }) => (
        <View style={isLoading && styles.dimmed}>
          <UserCard
            user={item}
            extraLabel={config.extraLabel}
            extraValue={item[config.extraField]}
            isCurrentUser={item.id === currentUser?.id}
            deleting={deletingId === item.id}
            onEdit={() => router.push(`${config.basePath}/edit/${item.id}`)}
            onDelete={() => handleDelete(item)}
          />
        </View>
      )}
      ListEmptyComponent={
        error ? (
          <ErrorView message={error} onRetry={retry} />
        ) : isLoading ? (
          <LoadingView />
        ) : (
          <EmptyView
            icon={config.icon}
            title={`Nenhum ${config.singular} encontrado`}
            message={debouncedSearch ? 'Tente buscar por outro termo.' : undefined}
          />
        )
      }
      ListFooterComponent={
        users.length > 0 && !error ? (
          <View>
            {isLoading && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              onChange={setPage}
              disabled={isLoading}
            />
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleText: { flex: 1 },
  dimmed: { opacity: 0.5 },
  spinner: { marginTop: spacing.md },
});
