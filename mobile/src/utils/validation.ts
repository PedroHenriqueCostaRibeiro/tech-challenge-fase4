import type { PostInput, UserInput } from '@/types';

/** Erros por campo exibidos nos formulários. */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mesmas regras da API, para avisar antes de enviar. */
export function validatePost(input: PostInput): FormErrors<PostInput> {
  const errors: FormErrors<PostInput> = {};
  if (input.title.trim().length < 3) errors.title = 'Informe um título com ao menos 3 caracteres';
  if (input.content.trim().length < 10) errors.content = 'O conteúdo deve ter ao menos 10 caracteres';
  if (input.author.trim().length < 3) errors.author = 'Informe o autor (ao menos 3 caracteres)';
  return errors;
}

export function validateUser(input: UserInput, mode: 'create' | 'edit'): FormErrors<UserInput> {
  const errors: FormErrors<UserInput> = {};
  if (input.name.trim().length < 3) errors.name = 'Informe o nome (ao menos 3 caracteres)';
  if (!EMAIL_REGEX.test(input.email.trim())) errors.email = 'Informe um e-mail válido';
  if (mode === 'create' && input.password.length < 6) {
    errors.password = 'A senha deve ter ao menos 6 caracteres';
  }
  if (mode === 'edit' && input.password.length > 0 && input.password.length < 6) {
    errors.password = 'A nova senha deve ter ao menos 6 caracteres';
  }
  return errors;
}

export function validateLogin(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};
  if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Informe um e-mail válido';
  if (!password) errors.password = 'Informe a senha';
  return errors;
}

export const hasErrors = (errors: object) => Object.values(errors).some(Boolean);

/** Converte os erros da API ({ campo: [mensagens] }) para o formato dos formulários. */
export function fromApiErrors<T>(fieldErrors: Partial<Record<string, string[]>>): FormErrors<T> {
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.length) result[field] = messages[0];
  }
  return result as FormErrors<T>;
}
