import type { Comment, Paginated, Post, PostInput } from '@/types';
import { request } from './api';

export const postsService = {
  /** Lista paginada; `q` filtra por palavras-chave (título, conteúdo e autor). */
  list: (params: { page?: number; limit?: number; q?: string } = {}) =>
    request<Paginated<Post>>('/posts', { query: params }),

  get: (id: number) => request<Post>(`/posts/${id}`),

  create: (input: PostInput) => request<Post>('/posts', { method: 'POST', body: input }),

  update: (id: number, input: Partial<PostInput>) =>
    request<Post>(`/posts/${id}`, { method: 'PUT', body: input }),

  remove: (id: number) => request<void>(`/posts/${id}`, { method: 'DELETE' }),

  listComments: (postId: number) =>
    request<{ data: Comment[] }>(`/posts/${postId}/comments`).then((res) => res.data),

  addComment: (postId: number, content: string) =>
    request<Comment>(`/posts/${postId}/comments`, { method: 'POST', body: { content } }),

  removeComment: (postId: number, commentId: number) =>
    request<void>(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),
};
