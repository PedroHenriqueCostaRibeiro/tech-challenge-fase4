export interface PageParams {
  page: number;
  limit: number;
  offset: number;
  /** Palavras-chave de busca (opcional). */
  q?: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

const MAX_LIMIT = 50;

function toInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

/**
 * Lê `page`, `limit` e `q` (ou `query`/`search`) da query string.
 * Valores inválidos caem nos padrões; `limit` fica entre 1 e 50.
 */
export function parsePageParams(query: Record<string, unknown>, defaultLimit = 10): PageParams {
  const page = toInt(query.page, 1, 1, 1_000_000);
  const limit = toInt(query.limit, defaultLimit, 1, MAX_LIMIT);
  const rawQ = [query.q, query.query, query.search].find((v) => typeof v === 'string') as
    | string
    | undefined;
  const q = rawQ?.trim().slice(0, 100) || undefined;
  return { page, limit, offset: (page - 1) * limit, q };
}

export function buildMeta(page: number, limit: number, total: number): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
