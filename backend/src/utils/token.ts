import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';
import type { Role } from '../modules/users/user.repository.js';

export function signToken(user: { id: number; role: Role; name: string }): string {
  return jwt.sign({ role: user.role, name: user.name }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

/** Valida o token e devolve o id do usuário. Lança erro se inválido/expirado. */
export function verifyToken(token: string): { userId: number } {
  const payload = jwt.verify(token, config.jwtSecret);
  const userId = typeof payload === 'object' ? Number(payload.sub) : Number.NaN;
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Token sem usuário válido');
  }
  return { userId };
}
