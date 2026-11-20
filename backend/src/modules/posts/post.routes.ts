import { Router, type RequestHandler } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { HttpError, parseId } from '../../utils/http-error.js';
import { buildMeta, parsePageParams } from '../../utils/pagination.js';
import type { UserRepository } from '../users/user.repository.js';
import type { PostRepository } from './post.repository.js';
import { createPostSchema, updatePostSchema } from './post.schemas.js';

/**
 * Leitura é pública (alunos e visitantes).
 * Criar, editar e excluir exige login de professor.
 */
export function createPostRouter(posts: PostRepository, users: UserRepository): Router {
  const router = Router();
  const teacherOnly = [authenticate(users), requireRole('teacher')];

  function findOr404(rawId: unknown) {
    const post = posts.findById(parseId(rawId));
    if (!post) throw new HttpError(404, 'Post não encontrado');
    return post;
  }

  const list: RequestHandler = (req, res) => {
    const params = parsePageParams(req.query);
    const { posts: data, total } = posts.list(params);
    res.json({ data, meta: buildMeta(params.page, params.limit, total) });
  };

  // GET /posts?q=palavras&page=1&limit=10  e o atalho GET /posts/search?q=...
  router.get('/', list);
  router.get('/search', list);

  router.get('/:id', (req, res) => {
    res.json(findOr404(req.params.id));
  });

  router.post('/', ...teacherOnly, (req, res) => {
    const input = createPostSchema.parse(req.body ?? {});
    const post = posts.create({
      title: input.title,
      content: input.content,
      author: input.author ?? req.user!.name,
      authorId: req.user!.id,
    });
    res.status(201).json(post);
  });

  router.put('/:id', ...teacherOnly, (req, res) => {
    const current = findOr404(req.params.id);
    const input = updatePostSchema.parse(req.body ?? {});
    res.json(posts.update(current.id, input));
  });

  router.delete('/:id', ...teacherOnly, (req, res) => {
    const post = findOr404(req.params.id);
    posts.delete(post.id);
    res.status(204).end();
  });

  return router;
}
