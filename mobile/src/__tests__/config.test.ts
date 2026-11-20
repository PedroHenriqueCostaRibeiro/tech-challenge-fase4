import { resolveApiUrl } from '@/services/config';

describe('resolveApiUrl', () => {
  it('usa EXPO_PUBLIC_API_URL quando definido (sem barra final)', () => {
    expect(resolveApiUrl({ envUrl: 'http://10.0.0.5:4000/' })).toBe('http://10.0.0.5:4000');
  });

  it('no Expo Go usa o IP do computador que roda o Metro', () => {
    expect(resolveApiUrl({ envUrl: '', hostUri: '192.168.0.20:8081', platform: 'ios' })).toBe(
      'http://192.168.0.20:3333',
    );
  });

  it('no emulador Android usa 10.0.2.2', () => {
    expect(resolveApiUrl({ envUrl: '', hostUri: 'localhost:8081', platform: 'android' })).toBe(
      'http://10.0.2.2:3333',
    );
  });

  it('na web usa localhost', () => {
    expect(resolveApiUrl({ envUrl: '', hostUri: null, platform: 'web' })).toBe('http://localhost:3333');
  });
});
