try {
  // Carrega variáveis do arquivo .env (se existir). Sem ele, valem os padrões abaixo.
  process.loadEnvFile();
} catch {
  // .env é opcional em desenvolvimento.
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET precisa ser definido em produção.');
}

export const config = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3333),
  jwtSecret: process.env.JWT_SECRET ?? 'edublog-segredo-de-desenvolvimento',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  databasePath: process.env.DATABASE_PATH ?? 'data/edublog.db',
  // Custo menor nos testes para deixá-los rápidos.
  bcryptRounds: nodeEnv === 'test' ? 4 : 10,
} as const;
