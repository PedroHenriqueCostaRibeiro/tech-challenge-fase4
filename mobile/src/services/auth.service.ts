import type { User } from '@/types';
import { request } from './api';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  me: () => request<User>('/auth/me'),
};
