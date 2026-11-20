import { ApiError, request, setAuthToken, setUnauthorizedHandler } from '@/services/api';
import { API_URL } from '@/services/config';

function mockFetch(status: number, body: unknown) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

afterEach(() => {
  setAuthToken(null);
  setUnauthorizedHandler(null);
});

describe('request', () => {
  it('monta a URL com a query e devolve o JSON', async () => {
    const fetchMock = mockFetch(200, { data: [], meta: {} });
    const result = await request('/posts', { query: { page: 2, q: 'história', empty: '' } });

    expect(result).toEqual({ data: [], meta: {} });
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_URL}/posts?page=2&q=hist%C3%B3ria`);
  });

  it('envia o token JWT e o corpo em JSON', async () => {
    const fetchMock = mockFetch(201, { id: 1 });
    setAuthToken('meu-token');
    await request('/posts', { method: 'POST', body: { title: 'x' } });

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer meu-token');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"title":"x"}');
  });

  it('transforma erros da API em ApiError com mensagens por campo', async () => {
    mockFetch(400, { message: 'Dados inválidos', errors: { title: ['Título é obrigatório'] } });

    await expect(request('/posts', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 400,
      message: 'Dados inválidos',
      fieldErrors: { title: ['Título é obrigatório'] },
    });
  });

  it('avisa quando a sessão expira (401 com token)', async () => {
    mockFetch(401, { message: 'Sessão inválida' });
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    setAuthToken('expirado');

    await expect(request('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('não dispara o aviso de sessão no login sem token', async () => {
    mockFetch(401, { message: 'E-mail ou senha inválidos' });
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);

    await expect(request('/auth/login', { method: 'POST', body: {} })).rejects.toThrow(
      'E-mail ou senha inválidos',
    );
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('erro de rede vira mensagem amigável', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

    await expect(request('/posts')).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('Não foi possível conectar à API'),
    });
  });

  it('resposta 204 devolve undefined', async () => {
    mockFetch(204, null);
    await expect(request('/posts/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
