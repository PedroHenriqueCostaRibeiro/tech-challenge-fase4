import cors from 'cors';
import express, { type RequestHandler } from 'express';
import { config } from './config.js';
import type { Database } from './db/database.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { CommentRepository } from './modules/comments/comment.repository.js';
import { createCommentRouter } from './modules/comments/comment.routes.js';
import { PostRepository } from './modules/posts/post.repository.js';
import { createPostRouter } from './modules/posts/post.routes.js';
import { UserRepository } from './modules/users/user.repository.js';
import { createUserRouter } from './modules/users/user.routes.js';

const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
};

/** Monta a aplicação Express. Recebe o banco para facilitar os testes. */
export function createApp(db: Database) {
  const users = new UserRepository(db);
  const posts = new PostRepository(db);
  const comments = new CommentRepository(db);

  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  if (config.nodeEnv !== 'test') app.use(requestLogger);

  app.get('/', (_req, res) => {
    res.json({
      name: 'EduBlog API',
      version: '1.0.0',
      endpoints: {
        auth: ['POST /auth/login', 'GET /auth/me'],
        posts: [
          'GET /posts?q=&page=&limit=',
          'GET /posts/search?q=',
          'GET /posts/:id',
          'POST /posts',
          'PUT /posts/:id',
          'DELETE /posts/:id',
        ],
        comments: [
          'GET /posts/:postId/comments',
          'POST /posts/:postId/comments',
          'DELETE /posts/:postId/comments/:commentId',
        ],
        teachers: ['GET /teachers', 'GET /teachers/:id', 'POST /teachers', 'PUT /teachers/:id', 'DELETE /teachers/:id'],
        students: ['GET /students', 'GET /students/:id', 'POST /students', 'PUT /students/:id', 'DELETE /students/:id'],
      },
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/auth', createAuthRouter(users));
  app.use('/posts/:postId/comments', createCommentRouter(comments, posts, users));
  app.use('/posts', createPostRouter(posts, users));
  app.use('/teachers', createUserRouter(users, 'teacher'));
  app.use('/students', createUserRouter(users, 'student'));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
