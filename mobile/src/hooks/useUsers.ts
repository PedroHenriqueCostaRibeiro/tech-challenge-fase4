import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/services/api';
import { usersService } from '@/services/users.service';
import type { PageMeta, Role, User } from '@/types';

export const USERS_PAGE_SIZE = 6;

const EMPTY_META: PageMeta = { page: 1, limit: USERS_PAGE_SIZE, total: 0, totalPages: 1 };

/** Lista paginada (página a página) de professores ou alunos, com busca. */
export function useUsers(role: Role, search: string) {
  // A página "pertence" a uma busca: se a busca muda, voltamos à página 1 automaticamente.
  const [pageState, setPageState] = useState({ search, page: 1 });
  const page = pageState.search === search ? pageState.page : 1;
  const setPage = useCallback((next: number) => setPageState({ search, page: next }), [search]);

  const key = `${role}|${search}|${page}`;
  const [loaded, setLoaded] = useState<{ key: string; users: User[]; meta: PageMeta } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const requestId = useRef(0);

  const fetchPage = useCallback(() => {
    const id = ++requestId.current;
    return usersService(role)
      .list({ page, limit: USERS_PAGE_SIZE, q: search || undefined })
      .then(
        (res) => {
          if (id !== requestId.current) return;
          // Página ficou vazia (ex.: excluiu o último item dela): volta uma página.
          if (res.data.length === 0 && page > 1) {
            setPageState({ search, page: page - 1 });
            return;
          }
          setLoaded({ key, users: res.data, meta: res.meta });
          setError(null);
        },
        (err: unknown) => {
          if (id === requestId.current) setError({ key, message: getErrorMessage(err) });
        },
      );
  }, [role, page, search, key]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const currentError = error?.key === key ? error.message : null;

  const retry = useCallback(() => {
    setError(null);
    return fetchPage();
  }, [fetchPage]);

  return {
    // Enquanto a nova página carrega, a anterior continua visível (esmaecida).
    users: loaded?.users ?? [],
    meta: loaded?.meta ?? EMPTY_META,
    page,
    setPage,
    isLoading: loaded?.key !== key && !currentError,
    error: currentError,
    reload: fetchPage,
    retry,
  };
}
