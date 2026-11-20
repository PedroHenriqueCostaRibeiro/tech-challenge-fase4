import { z } from 'zod';

const title = z
  .string({ error: 'Título é obrigatório' })
  .trim()
  .min(3, 'Título deve ter ao menos 3 caracteres')
  .max(150, 'Título deve ter no máximo 150 caracteres');

const content = z
  .string({ error: 'Conteúdo é obrigatório' })
  .trim()
  .min(10, 'Conteúdo deve ter ao menos 10 caracteres')
  .max(20000, 'Conteúdo deve ter no máximo 20.000 caracteres');

const author = z
  .string()
  .trim()
  .min(3, 'Autor deve ter ao menos 3 caracteres')
  .max(100, 'Autor deve ter no máximo 100 caracteres');

/** Se o autor não for informado, a API usa o nome do professor logado. */
export const createPostSchema = z.object({ title, content, author: author.optional() });

export const updatePostSchema = z.object({
  title: title.optional(),
  content: content.optional(),
  author: author.optional(),
});
