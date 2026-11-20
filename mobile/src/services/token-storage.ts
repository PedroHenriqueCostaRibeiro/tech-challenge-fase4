import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'edublog.token';

/**
 * Guarda o token JWT de forma segura:
 * Keychain/Keystore no celular (SecureStore) e localStorage na web.
 */
export const tokenStorage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(KEY) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(KEY);
  },

  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(KEY, token);
      } catch {
        // armazenamento indisponível (aba anônima): a sessão dura até fechar a página
      }
      return;
    }
    await SecureStore.setItemAsync(KEY, token);
  },

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(KEY);
      } catch {
        // ignora
      }
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  },
};
