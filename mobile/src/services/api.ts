import type { FieldErrors } from '@/types';
import { API_URL } from './config';

/** Erro devolvido pela API (ou de rede), com mensagem pronta para exibir. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Define o token JWT enviado em todas as requisições. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Função chamada quando a API responde 401 com um token ativo (sessão expirou). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: Query): string {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return `${API_URL}${path}${params.length ? `?${params.join('&')}` : ''}`;
}

/**
 * Faz uma chamada REST à API e devolve o JSON da resposta.
 * Lança ApiError com mensagem amigável em caso de falha.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, timeoutMs = 15000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const tokenUsed = authToken;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(tokenUsed ? { Authorization: `Bearer ${tokenUsed}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ApiError(
      0,
      aborted
        ? 'O servidor demorou para responder. Tente novamente.'
        : `Não foi possível conectar à API (${API_URL}). Verifique se o back-end está rodando.`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && tokenUsed && onUnauthorized) {
      onUnauthorized();
    }
    const message =
      (data && typeof data.message === 'string' && data.message) ||
      `Erro inesperado (${response.status})`;
    throw new ApiError(response.status, message, (data?.errors as FieldErrors) ?? {});
  }

  return data as T;
}

/** Mensagem amigável para qualquer erro. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Algo deu errado. Tente novamente.';
}
