import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/services/api';
import { postsService } from '@/services/posts.service';
import type { Post } from '@/types';

const PAGE_SIZE = 10;

interface LoadedPosts {
  /** Busca a que estes dados pertencem. */
  search: string;
  posts: Post[];
  page: number;
  totalPages: number;
  total: number;
}

/**
 * Lista de posts com busca e rolagem infinita.
 * Quando `search` muda, recomeça da página 1. "Carregando" é derivado:
 * enquanto os dados guardados forem de outra busca, a lista está carregando.
 */
export function usePosts(search: string) {
  const [loaded, setLoaded] = useState<LoadedPosts | null>(null);
  const [error, setError] = useState<{ search: string; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Descarta respostas antigas quando o usuário digita rápido.
  const requestId = useRef(0);

  const fetchFirstPage = useCallback(() => {
    const id = ++requestId.current;
    return postsService.list({ page: 1, limit: PAGE_SIZE, q: search || undefined }).then(
      (res) => {
        if (id !== requestId.current) return;
        setLoaded({
          search,
          posts: res.data,
          page: res.meta.page,
          totalPages: res.meta.totalPages,
          total: res.meta.total,
        });
        setError(null);
      },
      (err: unknown) => {
        if (id === requestId.current) setError({ search, message: getErrorMessage(err) });
      },
    );
  }, [search]);

  useEffect(() => {
    void fetchFirstPage();
  }, [fetchFirstPage]);

  const current = loaded?.search === search ? loaded : null;
  const currentError = error?.search === search ? error.message : null;
  const isLoading = !current && !currentError;

  /** Puxar para atualizar (mostra o indicador no topo). */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchFirstPage();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFirstPage]);

  /** "Tentar novamente" depois de um erro. */
  const retry = useCallback(() => {
    setError(null);
    return fetchFirstPage();
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (!current || isLoadingMore || isRefreshing || current.page >= current.totalPages) return;
    const id = requestId.current;
    setIsLoadingMore(true);
    try {
      const res = await postsService.list({
        page: current.page + 1,
        limit: PAGE_SIZE,
        q: search || undefined,
      });
      if (id !== requestId.current) return;
      setLoaded((prev) => {
        if (!prev || prev.search !== search) return prev;
        const known = new Set(prev.posts.map((p) => p.id));
        return {
          ...prev,
          posts: [...prev.posts, ...res.data.filter((p) => !known.has(p.id))],
          page: res.meta.page,
          totalPages: res.meta.totalPages,
          total: res.meta.total,
        };
      });
    } catch (err) {
      if (id === requestId.current) setError({ search, message: getErrorMessage(err) });
    } finally {
      setIsLoadingMore(false);
    }
  }, [current, isLoadingMore, isRefreshing, search]);

  /** Remove um post da lista sem recarregar (após excluir). */
  const removeLocal = useCallback((postId: number) => {
    setLoaded((prev) =>
      prev
        ? { ...prev, posts: prev.posts.filter((p) => p.id !== postId), total: Math.max(0, prev.total - 1) }
        : prev,
    );
  }, []);

  return {
    posts: current?.posts ?? [],
    total: current?.total ?? 0,
    hasMore: current ? current.page < current.totalPages : false,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error: currentError,
    refresh,
    /** Atualização silenciosa (ao voltar para a tela). */
    silentRefresh: fetchFirstPage,
    retry,
    loadMore,
    removeLocal,
  };
}
