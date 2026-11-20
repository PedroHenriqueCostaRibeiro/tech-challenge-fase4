import { z } from 'zod';

const name = z
  .string({ error: 'Nome é obrigatório' })
  .trim()
  .min(3, 'Nome deve ter ao menos 3 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres');

export const emailSchema = z
  .string({ error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .pipe(z.email('E-mail inválido'));

const password = z
  .string({ error: 'Senha é obrigatória' })
  .min(6, 'Senha deve ter ao menos 6 caracteres')
  .max(100, 'Senha deve ter no máximo 100 caracteres');

/**
 * Texto opcional: ausente = não altera; vazio = limpa (null).
 */
const optionalText = z
  .string()
  .trim()
  .max(100, 'Deve ter no máximo 100 caracteres')
  .nullish()
  .transform((value) => (value === undefined ? undefined : value || null));

export const createUserSchema = z.object({
  name,
  email: emailSchema,
  password,
  subject: optionalText,
  registration: optionalText,
});

export const updateUserSchema = z.object({
  name: name.optional(),
  email: emailSchema.optional(),
  // Senha em branco na edição significa "manter a atual".
  password: z
    .union([z.literal(''), password])
    .optional()
    .transform((value) => value || undefined),
  subject: optionalText,
  registration: optionalText,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
});
