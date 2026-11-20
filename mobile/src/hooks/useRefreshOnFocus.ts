import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Recarrega os dados sempre que a tela volta a ficar visível
 * (ex.: depois de editar um item e voltar para a lista).
 * Ignora o primeiro foco, porque a carga inicial já é feita pelo próprio hook de dados.
 */
export function useRefreshOnFocus(refresh: () => unknown) {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refresh();
    }, [refresh]),
  );
}
