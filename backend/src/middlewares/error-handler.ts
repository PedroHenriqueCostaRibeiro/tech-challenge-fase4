import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { HttpError } from '../utils/http-error.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ message: `Rota não encontrada: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Dados inválidos. Verifique os campos.',
      errors: z.flattenError(error).fieldErrors,
    });
    return;
  }

  // JSON malformado no corpo da requisição
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Corpo da requisição não é um JSON válido' });
    return;
  }

  if (typeof error?.message === 'string' && error.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({ message: 'Registro duplicado' });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor' });
};
