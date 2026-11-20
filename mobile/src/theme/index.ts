/**
 * Identidade visual do EduBlog: paleta, espaçamentos, tipografia e sombras.
 * Todos os componentes usam estes tokens — mude aqui para mudar o app inteiro.
 */
export const colors = {
  primary: '#3730A3',
  primaryLight: '#4F46E5',
  primarySoft: '#EEF2FF',
  accent: '#F59E0B',
  accentSoft: '#FEF3C7',

  background: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E2E5EE',

  text: '#1F2937',
  textMuted: '#5B6475',
  textOnPrimary: '#FFFFFF',

  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  success: '#15803D',
  successSoft: '#DCFCE7',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, lineHeight: 24, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
} as const;

export const shadow = {
  card: {
    shadowColor: '#1F2937',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;

/** Altura mínima recomendada para áreas de toque (acessibilidade). */
export const MIN_TOUCH = 44;
