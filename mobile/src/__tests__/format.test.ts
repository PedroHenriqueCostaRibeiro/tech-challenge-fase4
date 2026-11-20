import { excerpt, formatDate, initials } from '@/utils/format';

describe('formatDate', () => {
  it('formata a data em português', () => {
    expect(formatDate('2026-11-19T12:00:00')).toBe('19 nov 2026');
    expect(formatDate('2026-01-05T12:00:00')).toBe('5 jan 2026');
  });

  it('devolve vazio para data inválida', () => {
    expect(formatDate('não é data')).toBe('');
  });
});

describe('excerpt', () => {
  it('mantém textos curtos e junta as linhas', () => {
    expect(excerpt('Olá\n\nmundo')).toBe('Olá mundo');
  });

  it('corta textos longos em uma palavra e adiciona reticências', () => {
    const text = 'palavra '.repeat(40);
    const result = excerpt(text, 50);
    expect(result.length).toBeLessThanOrEqual(51);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/\s…$/);
  });
});

describe('initials', () => {
  it('usa a primeira letra do primeiro e do último nome', () => {
    expect(initials('Ana Souza')).toBe('AS');
    expect(initials('maria da silva')).toBe('MS');
    expect(initials('Cher')).toBe('C');
    expect(initials('   ')).toBe('?');
  });
});
