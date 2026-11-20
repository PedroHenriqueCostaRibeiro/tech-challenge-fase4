import type { RequestHandler } from 'express';
import {
  toPublicUser,
  type PublicUser,
  type Role,
  type UserRepository,
} from '../modules/users/user.repository.js';
import { HttpError } from '../utils/http-error.js';
import { verifyToken } from '../utils/token.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Usuário autenticado (preenchido pelo middleware `authenticate`). */
      user?: PublicUser;
    }
  }
}

/**
 * Exige um token JWT válido no cabeçalho `Authorization: Bearer <token>`.
 * O usuário é recarregado do banco, então contas excluídas perdem o acesso na hora.
 */
export function authenticate(users: UserRepository): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Autenticação necessária');
    }

    let userId: number;
    try {
      userId = verifyToken(header.slice('Bearer '.length).trim()).userId;
    } catch {
      throw new HttpError(401, 'Sessão inválida ou expirada. Faça login novamente.');
    }

    const user = users.findById(userId);
    if (!user) {
      throw new HttpError(401, 'Sessão inválida ou expirada. Faça login novamente.');
    }

    req.user = toPublicUser(user);
    next();
  };
}

/** Permite o acesso apenas aos papéis informados (use depois de `authenticate`). */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      throw new HttpError(401, 'Autenticação necessária');
    }
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, 'Você não tem permissão para realizar esta ação');
    }
    next();
  };
}
