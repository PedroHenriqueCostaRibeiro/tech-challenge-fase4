import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/services/api';

/**
 * Carrega um recurso da API ao montar a tela (ex.: um post, os comentários).
 * `fetcher` deve ser memorizado com useCallback.
 *
 * - reload(): mostra o carregamento de novo (botão "Tentar novamente");
 * - refresh(): atualiza em segundo plano, sem esconder o conteúdo atual.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const requestId = useRef(0);

  // Os setState ficam nos callbacks da Promise (depois da resposta), nunca direto no efeito.
  const refresh = useCallback(() => {
    const id = ++requestId.current;
    return fetcher().then(
      (result) => {
        if (id !== requestId.current) return;
        setData(result);
        setError(null);
        setIsLoading(false);
      },
      (err: unknown) => {
        if (id !== requestId.current) return;
        setError(getErrorMessage(err));
        setIsLoading(false);
      },
    );
  }, [fetcher]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return refresh();
  }, [refresh]);

  return { data, setData, error, isLoading, reload, refresh };
}
