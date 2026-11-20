import { config } from '../config.js';
import { openDatabase } from '../db/database.js';
import { DEMO_ACCOUNTS, seedDatabase } from '../db/seed.js';

/** `npm run seed`: apaga o banco e recria os dados de demonstração. */
const db = openDatabase(config.databasePath);
seedDatabase(db);
db.close();

console.log(`Banco recriado em ${config.databasePath}`);
console.log(`Professor: ${DEMO_ACCOUNTS.teacher.email}`);
console.log(`Aluno:     ${DEMO_ACCOUNTS.student.email}`);
console.log('Senhas: veja o README.');
