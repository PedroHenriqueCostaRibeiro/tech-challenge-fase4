import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db/database.js';
import { DEMO_ACCOUNTS, seedDatabase } from '../src/db/seed.js';

type App = ReturnType<typeof createApp>;

let app: App;
let teacherToken: string;
let studentToken: string;

async function login(email: string, password: string): Promise<string> {
  const res = await request(app).post('/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeEach(async () => {
  const db = openDatabase(':memory:');
  seedDatabase(db);
  app = createApp(db);
  teacherToken = await login(DEMO_ACCOUNTS.teacher.email, DEMO_ACCOUNTS.teacher.password);
  studentToken = await login(DEMO_ACCOUNTS.student.email, DEMO_ACCOUNTS.student.password);
});

describe('saúde e rotas desconhecidas', () => {
  it('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rota inexistente devolve 404 em JSON', async () => {
    const res = await request(app).get('/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Rota não encontrada/);
  });
});

describe('autenticação', () => {
  it('login de professor devolve token e usuário sem senha', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'PROFESSOR@edublog.com ', password: DEMO_ACCOUNTS.teacher.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ role: 'teacher', email: DEMO_ACCOUNTS.teacher.email });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('senha errada devolve 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: DEMO_ACCOUNTS.teacher.email, password: 'errada' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('E-mail ou senha inválidos');
  });

  it('login sem campos devolve 400 com erros por campo', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.errors.email).toBeDefined();
    expect(res.body.errors.password).toBeDefined();
  });

  it('GET /auth/me exige token e devolve o usuário logado', async () => {
    expect((await request(app).get('/auth/me')).status).toBe(401);
    expect((await request(app).get('/auth/me').set(auth('token-invalido'))).status).toBe(401);

    const res = await request(app).get('/auth/me').set(auth(studentToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ role: 'student', email: DEMO_ACCOUNTS.student.email });
  });
});

describe('posts', () => {
  it('lista posts publicamente, paginados e do mais novo para o mais antigo', async () => {
    const res = await request(app).get('/posts?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toEqual({ page: 1, limit: 5, total: 12, totalPages: 3 });
    const dates = res.body.data.map((p: { createdAt: string }) => p.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(res.body.data[0]).toMatchObject({
      title: expect.any(String),
      author: expect.any(String),
      content: expect.any(String),
      commentCount: expect.any(Number),
    });
  });

  it('busca por palavras-chave no título, conteúdo e autor', async () => {
    const byTitle = await request(app).get('/posts').query({ q: 'fotossíntese' });
    expect(byTitle.body.data.map((p: { title: string }) => p.title)).toEqual([
      'Fotossíntese explicada em 5 minutos',
    ]);

    // Todas as palavras precisam aparecer (AND)
    const multi = await request(app).get('/posts/search').query({ q: 'revolução trabalho' });
    expect(multi.body.meta.total).toBe(1);

    const byAuthor = await request(app).get('/posts').query({ q: 'Carlos' });
    expect(byAuthor.body.meta.total).toBeGreaterThanOrEqual(2);

    const none = await request(app).get('/posts').query({ q: 'xyz-inexistente' });
    expect(none.body.data).toEqual([]);
    expect(none.body.meta.total).toBe(0);
  });

  it('busca trata % e _ como texto literal', async () => {
    const res = await request(app).get('/posts').query({ q: '%' });
    expect(res.body.meta.total).toBe(0);
  });

  it('GET /posts/:id devolve o post ou 404/400', async () => {
    const ok = await request(app).get('/posts/1');
    expect(ok.status).toBe(200);
    expect(ok.body.title).toBe('Bem-vindos ao EduBlog!');

    expect((await request(app).get('/posts/9999')).status).toBe(404);
    expect((await request(app).get('/posts/abc')).status).toBe(400);
  });

  it('apenas professores criam posts', async () => {
    const body = { title: 'Novo post', content: 'Conteúdo do novo post de teste.', author: 'Ana Souza' };

    expect((await request(app).post('/posts').send(body)).status).toBe(401);
    const asStudent = await request(app).post('/posts').set(auth(studentToken)).send(body);
    expect(asStudent.status).toBe(403);

    const created = await request(app).post('/posts').set(auth(teacherToken)).send(body);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...body, id: expect.any(Number), commentCount: 0 });

    const list = await request(app).get('/posts?limit=1');
    expect(list.body.data[0].id).toBe(created.body.id);
  });

  it('autor vazio usa o nome do professor logado', async () => {
    const res = await request(app)
      .post('/posts')
      .set(auth(teacherToken))
      .send({ title: 'Sem autor', content: 'Post criado sem informar o autor.' });
    expect(res.status).toBe(201);
    expect(res.body.author).toBe('Ana Souza');
  });

  it('valida os campos do post', async () => {
    const res = await request(app)
      .post('/posts')
      .set(auth(teacherToken))
      .send({ title: 'a', content: 'curto' });
    expect(res.status).toBe(400);
    expect(res.body.errors.title).toBeDefined();
    expect(res.body.errors.content).toBeDefined();
  });

  it('professor edita um post; aluno não', async () => {
    const forbidden = await request(app)
      .put('/posts/1')
      .set(auth(studentToken))
      .send({ title: 'Hackeado' });
    expect(forbidden.status).toBe(403);

    const res = await request(app)
      .put('/posts/1')
      .set(auth(teacherToken))
      .send({ title: 'Título atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Título atualizado');
    expect(res.body.content).toContain('espaço oficial');

    expect((await request(app).put('/posts/9999').set(auth(teacherToken)).send({})).status).toBe(404);
  });

  it('professor exclui um post (e seus comentários)', async () => {
    expect((await request(app).delete('/posts/1').set(auth(studentToken))).status).toBe(403);

    const res = await request(app).delete('/posts/1').set(auth(teacherToken));
    expect(res.status).toBe(204);
    expect((await request(app).get('/posts/1')).status).toBe(404);
    expect((await request(app).get('/posts/1/comments')).status).toBe(404);
  });
});

describe('comentários', () => {
  it('lista comentários publicamente', async () => {
    const res = await request(app).get('/posts/1/comments');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({ authorName: 'João Pereira', postId: 1 });
  });

  it('usuário logado comenta; visitante não', async () => {
    const body = { content: 'Comentário de teste' };
    expect((await request(app).post('/posts/2/comments').send(body)).status).toBe(401);

    const res = await request(app).post('/posts/2/comments').set(auth(studentToken)).send(body);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ content: 'Comentário de teste', authorName: 'João Pereira' });

    const post = await request(app).get('/posts/2');
    expect(post.body.commentCount).toBe(2);
  });

  it('autor ou professor exclui; outro aluno não', async () => {
    const comment = await request(app)
      .post('/posts/2/comments')
      .set(auth(teacherToken))
      .send({ content: 'Comentário do professor' });

    const res = await request(app)
      .delete(`/posts/2/comments/${comment.body.id}`)
      .set(auth(studentToken));
    expect(res.status).toBe(403);

    // Comentário 1 é do aluno João (aluno@edublog.com)
    expect((await request(app).delete('/posts/1/comments/1').set(auth(studentToken))).status).toBe(204);
    // Professor pode excluir comentário de qualquer pessoa
    expect((await request(app).delete('/posts/1/comments/2').set(auth(teacherToken))).status).toBe(204);
    // Comentário de outro post → 404
    expect((await request(app).delete('/posts/1/comments/3').set(auth(teacherToken))).status).toBe(404);
  });
});

describe.each([
  { path: '/teachers', role: 'teacher', extra: { subject: 'Artes' }, total: 7 },
  { path: '/students', role: 'student', extra: { registration: '2026999' }, total: 12 },
])('CRUD de $path', ({ path, role, extra, total }) => {
  it('exige login de professor', async () => {
    expect((await request(app).get(path)).status).toBe(401);
    expect((await request(app).get(path).set(auth(studentToken))).status).toBe(403);
  });

  it('lista paginada e com busca', async () => {
    const page1 = await request(app).get(`${path}?limit=5`).set(auth(teacherToken));
    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveLength(5);
    expect(page1.body.meta).toEqual({ page: 1, limit: 5, total, totalPages: Math.ceil(total / 5) });
    expect(page1.body.data.every((u: { role: string }) => u.role === role)).toBe(true);
    expect(page1.body.data[0].password_hash).toBeUndefined();

    const page2 = await request(app).get(`${path}?limit=5&page=2`).set(auth(teacherToken));
    expect(page2.body.data[0].id).not.toBe(page1.body.data[0].id);

    const search = await request(app).get(path).query({ q: 'zzz-ninguém' }).set(auth(teacherToken));
    expect(search.body.meta.total).toBe(0);
  });

  it('cria, busca, edita e exclui', async () => {
    const body = { name: 'Pessoa Nova', email: `nova${role}@edublog.com`, password: 'segredo1', ...extra };
    const created = await request(app).post(path).set(auth(teacherToken)).send(body);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: 'Pessoa Nova', role, ...extra });

    const id = created.body.id;
    const fetched = await request(app).get(`${path}/${id}`).set(auth(teacherToken));
    expect(fetched.body.email).toBe(body.email);

    // A nova conta consegue fazer login
    await login(body.email, 'segredo1');

    const updated = await request(app)
      .put(`${path}/${id}`)
      .set(auth(teacherToken))
      .send({ name: 'Pessoa Editada', password: '' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Pessoa Editada');
    // Senha em branco mantém a atual
    await login(body.email, 'segredo1');

    const removed = await request(app).delete(`${path}/${id}`).set(auth(teacherToken));
    expect(removed.status).toBe(204);
    expect((await request(app).get(`${path}/${id}`).set(auth(teacherToken))).status).toBe(404);
  });

  it('rejeita e-mail duplicado e dados inválidos', async () => {
    const duplicated = await request(app)
      .post(path)
      .set(auth(teacherToken))
      .send({ name: 'Duplicado', email: DEMO_ACCOUNTS.student.email, password: 'segredo1' });
    expect(duplicated.status).toBe(409);
    expect(duplicated.body.errors.email).toBeDefined();

    const invalid = await request(app)
      .post(path)
      .set(auth(teacherToken))
      .send({ name: 'A', email: 'nao-e-email', password: '1' });
    expect(invalid.status).toBe(400);
    expect(Object.keys(invalid.body.errors).sort()).toEqual(['email', 'name', 'password']);
  });
});

describe('regras específicas de usuários', () => {
  it('não acessa um aluno pela rota de professores', async () => {
    const student = await request(app).get('/students?limit=1').set(auth(teacherToken));
    const id = student.body.data[0].id;
    expect((await request(app).get(`/teachers/${id}`).set(auth(teacherToken))).status).toBe(404);
  });

  it('professor não pode excluir a própria conta', async () => {
    const me = await request(app).get('/auth/me').set(auth(teacherToken));
    const res = await request(app).delete(`/teachers/${me.body.id}`).set(auth(teacherToken));
    expect(res.status).toBe(400);
  });

  it('token de usuário excluído deixa de funcionar', async () => {
    const me = await request(app).get('/auth/me').set(auth(studentToken));
    await request(app).delete(`/students/${me.body.id}`).set(auth(teacherToken));
    expect((await request(app).get('/auth/me').set(auth(studentToken))).status).toBe(401);
  });
});
