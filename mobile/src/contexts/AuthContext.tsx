import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, setAuthToken, setUnauthorizedHandler } from '@/services/api';
import { authService } from '@/services/auth.service';
import { tokenStorage } from '@/services/token-storage';
import type { User } from '@/types';
import { notify } from '@/utils/feedback';

interface AuthContextValue {
  /** Usuário logado (null = visitante). */
  user: User | null;
  /** true enquanto a sessão salva é restaurada na abertura do app. */
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Professores podem criar/editar/excluir posts e gerenciar usuários. */
  isTeacher: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  /** Atualiza os dados do usuário logado (ex.: após editar o próprio cadastro). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await tokenStorage.clear();
  }, []);

  // Restaura a sessão salva ao abrir o app.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (!token) return;
        setAuthToken(token);
        const me = await authService.me();
        if (active) setUser(me);
      } catch (error) {
        setAuthToken(null);
        // Token inválido/expirado: descarta. Erro de rede: mantém para tentar na próxima abertura.
        if (error instanceof ApiError && error.status === 401) await tokenStorage.clear();
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Se a API responder 401 durante o uso, a sessão expirou: volta a ser visitante.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
      notify('Sessão expirada', 'Faça login novamente para continuar.');
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token, user: loggedUser } = await authService.login(email.trim(), password);
    setAuthToken(token);
    await tokenStorage.set(token);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    setUser(await authService.me());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      isTeacher: user?.role === 'teacher',
      signIn,
      signOut,
      refreshUser,
    }),
    [user, isLoading, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  }
  return context;
}
