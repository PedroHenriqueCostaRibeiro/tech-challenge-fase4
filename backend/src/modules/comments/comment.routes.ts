import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.js';
import { HttpError, parseId } from '../../utils/http-error.js';
import type { PostRepository } from '../posts/post.repository.js';
import type { UserRepository } from '../users/user.repository.js';
import type { CommentRepository } from './comment.repository.js';

const commentSchema = z.object({
  content: z
    .string({ error: 'Comentário é obrigatório' })
    .trim()
    .min(2, 'Comentário deve ter ao menos 2 caracteres')
    .max(1000, 'Comentário deve ter no máximo 1.000 caracteres'),
});

/**
 * Montado em /posts/:postId/comments.
 * Qualquer pessoa lê; usuários logados (professor ou aluno) comentam;
 * o autor do comentário ou um professor pode excluí-lo.
 */
export function createCommentRouter(
  comments: CommentRepository,
  posts: PostRepository,
  users: UserRepository,
): Router {
  const router = Router({ mergeParams: true });

  function postIdOr404(rawId: unknown): number {
    const postId = parseId(rawId);
    if (!posts.findById(postId)) throw new HttpError(404, 'Post não encontrado');
    return postId;
  }

  router.get('/', (req, res) => {
    const postId = postIdOr404((req.params as Record<string, string>).postId);
    res.json({ data: comments.listByPost(postId) });
  });

  router.post('/', authenticate(users), (req, res) => {
    const postId = postIdOr404((req.params as Record<string, string>).postId);
    const { content } = commentSchema.parse(req.body ?? {});
    const comment = comments.create({
      postId,
      userId: req.user!.id,
      authorName: req.user!.name,
      content,
    });
    res.status(201).json(comment);
  });

  router.delete('/:commentId', authenticate(users), (req, res) => {
    const postId = postIdOr404((req.params as Record<string, string>).postId);
    const comment = comments.findById(parseId(req.params.commentId));
    if (!comment || comment.postId !== postId) {
      throw new HttpError(404, 'Comentário não encontrado');
    }
    const isOwner = comment.userId === req.user!.id;
    if (!isOwner && req.user!.role !== 'teacher') {
      throw new HttpError(403, 'Você só pode excluir os seus próprios comentários');
    }
    comments.delete(comment.id);
    res.status(204).end();
  });

  return router;
}
