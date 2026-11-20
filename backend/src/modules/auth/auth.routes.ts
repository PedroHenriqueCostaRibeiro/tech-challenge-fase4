import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { HttpError } from '../../utils/http-error.js';
import { signToken } from '../../utils/token.js';
import { toPublicUser, type UserRepository } from '../users/user.repository.js';
import { loginSchema } from '../users/user.schemas.js';

export function createAuthRouter(users: UserRepository): Router {
  const router = Router();

  /** Login de professores e alunos. Devolve o token JWT e os dados do usuário. */
  router.post('/login', async (req, res) => {
    const { email, password } = loginSchema.parse(req.body ?? {});
    const user = users.findByEmail(email);
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !valid) {
      throw new HttpError(401, 'E-mail ou senha inválidos');
    }

    res.json({ token: signToken(user), user: toPublicUser(user) });
  });

  /** Dados do usuário dono do token (usado para restaurar a sessão no app). */
  router.get('/me', authenticate(users), (req, res) => {
    res.json(req.user);
  });

  return router;
}
