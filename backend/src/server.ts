import { networkInterfaces } from 'node:os';
import { createApp } from './app.js';
import { config } from './config.js';
import { openDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import { UserRepository } from './modules/users/user.repository.js';

const db = openDatabase(config.databasePath);

// Primeira execução: popula o banco com dados de demonstração.
if (new UserRepository(db).count() === 0) {
  seedDatabase(db);
  console.log('Banco vazio: dados de demonstração criados (contas no README).');
}

/** IPs da máquina na rede local — use um deles no app rodando no celular. */
function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => net!.address);
}

const app = createApp(db);

app.listen(config.port, '0.0.0.0', (error?: Error) => {
  if (error) {
    console.error('Não foi possível iniciar a API:', error.message);
    process.exit(1);
  }
  console.log(`EduBlog API rodando em http://localhost:${config.port}`);
  for (const ip of lanAddresses()) {
    console.log(`  Na rede local: http://${ip}:${config.port}`);
  }
});
