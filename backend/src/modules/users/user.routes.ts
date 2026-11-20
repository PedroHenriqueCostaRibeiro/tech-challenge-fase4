import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { config } from '../../config.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { HttpError, parseId } from '../../utils/http-error.js';
import { buildMeta, parsePageParams } from '../../utils/pagination.js';
import { toPublicUser, type Role, type UserRepository } from './user.repository.js';
import { createUserSchema, updateUserSchema } from './user.schemas.js';

const LABELS: Record<Role, string> = { teacher: 'Professor', student: 'Aluno' };

/**
 * CRUD de usuários de um papel (professores ou alunos).
 * Montado em /teachers e /students. Apenas professores têm acesso.
 */
export function createUserRouter(users: UserRepository, role: Role): Router {
  const router = Router();
  const label = LABELS[role];

  router.use(authenticate(users), requireRole('teacher'));

  function findOr404(rawId: unknown) {
    const user = users.findById(parseId(rawId));
    if (!user || user.role !== role) {
      throw new HttpError(404, `${label} não encontrado`);
    }
    return user;
  }

  function ensureEmailAvailable(email: string, ignoreId?: number) {
    const existing = users.findByEmail(email);
    if (existing && existing.id !== ignoreId) {
      throw new HttpError(409, 'Já existe um usuário com este e-mail', {
        email: ['E-mail já cadastrado'],
      });
    }
  }

  /** Cada papel guarda apenas o seu campo extra: disciplina (professor) ou matrícula (aluno). */
  function roleFields(input: { subject?: string | null; registration?: string | null }) {
    return role === 'teacher' ? { subject: input.subject } : { registration: input.registration };
  }

  router.get('/', (req, res) => {
    const params = parsePageParams(req.query);
    const { rows, total } = users.list(role, params);
    res.json({ data: rows.map(toPublicUser), meta: buildMeta(params.page, params.limit, total) });
  });

  router.get('/:id', (req, res) => {
    res.json(toPublicUser(findOr404(req.params.id)));
  });

  router.post('/', async (req, res) => {
    const input = createUserSchema.parse(req.body ?? {});
    ensureEmailAvailable(input.email);
    const user = users.create({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, config.bcryptRounds),
      role,
      ...roleFields(input),
    });
    res.status(201).json(toPublicUser(user));
  });

  router.put('/:id', async (req, res) => {
    const current = findOr404(req.params.id);
    const input = updateUserSchema.parse(req.body ?? {});
    if (input.email) ensureEmailAvailable(input.email, current.id);

    const updated = users.update(current.id, {
      name: input.name,
      email: input.email,
      passwordHash: input.password
        ? await bcrypt.hash(input.password, config.bcryptRounds)
        : undefined,
      ...roleFields(input),
    });
    res.json(toPublicUser(updated!));
  });

  router.delete('/:id', (req, res) => {
    const user = findOr404(req.params.id);
    if (user.id === req.user!.id) {
      throw new HttpError(400, 'Você não pode excluir a sua própria conta');
    }
    users.delete(user.id);
    res.status(204).end();
  });

  return router;
}
