import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const API_PORT = 3333;

/**
 * Descobre o endereço da API:
 * 1. EXPO_PUBLIC_API_URL (arquivo .env), se definido;
 * 2. no Expo Go, o IP do computador que roda o Metro (mesma máquina da API);
 * 3. emulador Android: 10.0.2.2 (o "localhost" do computador);
 * 4. web / simulador iOS: localhost.
 */
export function resolveApiUrl(options?: {
  envUrl?: string;
  hostUri?: string | null;
  platform?: string;
}): string {
  const envUrl = options?.envUrl ?? process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  const hostUri = options?.hostUri ?? Constants.expoConfig?.hostUri ?? null;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}`;
  }

  const platform = options?.platform ?? Platform.OS;
  if (platform === 'android') return `http://10.0.2.2:${API_PORT}`;
  return `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
