import type { Paginated, Role, User, UserInput } from '@/types';
import { request } from './api';

const PATHS: Record<Role, string> = { teacher: '/teachers', student: '/students' };

/** CRUD de professores ou alunos (mesmos endpoints, caminhos diferentes). */
export function usersService(role: Role) {
  const base = PATHS[role];
  return {
    list: (params: { page?: number; limit?: number; q?: string } = {}) =>
      request<Paginated<User>>(base, { query: params }),

    get: (id: number) => request<User>(`${base}/${id}`),

    create: (input: UserInput) => request<User>(base, { method: 'POST', body: input }),

    update: (id: number, input: Partial<UserInput>) =>
      request<User>(`${base}/${id}`, { method: 'PUT', body: input }),

    remove: (id: number) => request<void>(`${base}/${id}`, { method: 'DELETE' }),
  };
}
