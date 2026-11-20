export type Role = 'teacher' | 'student';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  /** Disciplina (somente professores). */
  subject: string | null;
  /** Matrícula (somente alunos). */
  registration: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId: number | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number | null;
  authorName: string;
  content: string;
  createdAt: string;
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

export interface PostInput {
  title: string;
  content: string;
  author: string;
}

export interface UserInput {
  name: string;
  email: string;
  /** Obrigatória no cadastro; na edição, vazia mantém a senha atual. */
  password: string;
  subject?: string | null;
  registration?: string | null;
}

/** Erros de validação por campo, como devolvidos pela API. */
export type FieldErrors = Partial<Record<string, string[]>>;
