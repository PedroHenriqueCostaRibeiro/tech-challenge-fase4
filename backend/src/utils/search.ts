/** Escapa os curingas do LIKE (% e _) para que sejam buscados literalmente. */
function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Monta um filtro SQL em que TODAS as palavras-chave precisam aparecer
 * em pelo menos uma das colunas informadas.
 *
 * Ex.: q = "revolução industrial", columns = [title, content]
 *  => (title LIKE ? OR content LIKE ?) AND (title LIKE ? OR content LIKE ?)
 */
export function keywordFilter(q: string | undefined, columns: string[]) {
  const terms = (q ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 10);
  if (terms.length === 0) {
    return { sql: '', params: [] as string[] };
  }
  const group = `(${columns.map((column) => `${column} LIKE ? ESCAPE '\\'`).join(' OR ')})`;
  const sql = terms.map(() => group).join(' AND ');
  const params = terms.flatMap((term) => columns.map(() => `%${escapeLike(term)}%`));
  return { sql, params };
}
