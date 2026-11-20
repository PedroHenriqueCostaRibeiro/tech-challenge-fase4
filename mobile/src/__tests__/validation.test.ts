import {
  fromApiErrors,
  hasErrors,
  validateLogin,
  validatePost,
  validateUser,
} from '@/utils/validation';

describe('validatePost', () => {
  it('aceita um post válido', () => {
    const errors = validatePost({ title: 'Título', content: 'Conteúdo suficiente', author: 'Ana Souza' });
    expect(hasErrors(errors)).toBe(false);
  });

  it('aponta todos os campos inválidos', () => {
    const errors = validatePost({ title: ' a ', content: 'curto', author: '' });
    expect(Object.keys(errors).sort()).toEqual(['author', 'content', 'title']);
  });
});

describe('validateUser', () => {
  const valid = { name: 'Maria Silva', email: 'maria@edublog.com', password: 'segredo' };

  it('exige senha no cadastro', () => {
    expect(validateUser({ ...valid, password: '' }, 'create').password).toBeDefined();
  });

  it('permite senha vazia na edição (mantém a atual)', () => {
    expect(hasErrors(validateUser({ ...valid, password: '' }, 'edit'))).toBe(false);
  });

  it('valida senha curta na edição quando informada', () => {
    expect(validateUser({ ...valid, password: '123' }, 'edit').password).toBeDefined();
  });

  it('valida e-mail e nome', () => {
    const errors = validateUser({ name: 'Al', email: 'sem-arroba', password: 'segredo' }, 'create');
    expect(errors.name).toBeDefined();
    expect(errors.email).toBeDefined();
  });
});

describe('validateLogin', () => {
  it('exige e-mail válido e senha', () => {
    expect(validateLogin('x', '')).toEqual({
      email: 'Informe um e-mail válido',
      password: 'Informe a senha',
    });
    expect(validateLogin('aluno@edublog.com', '123')).toEqual({});
  });
});

describe('fromApiErrors', () => {
  it('pega a primeira mensagem de cada campo', () => {
    expect(fromApiErrors({ email: ['E-mail já cadastrado', 'outra'], name: [] })).toEqual({
      email: 'E-mail já cadastrado',
    });
  });
});
