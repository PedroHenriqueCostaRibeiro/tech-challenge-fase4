import type { SQLInputValue } from 'node:sqlite';
import { now, type Database } from '../../db/database.js';
import type { PageParams } from '../../utils/pagination.js';
import { keywordFilter } from '../../utils/search.js';

export type Role = 'teacher' | 'student';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  subject: string | null;
  registration: string | null;
  created_at: string;
  updated_at: string;
}

/** Usuário como é exposto pela API (sem o hash da senha). */
export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  /** Disciplina (professores). */
  subject: string | null;
  /** Matrícula (alunos). */
  registration: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  subject?: string | null;
  registration?: string | null;
}

export type UserChanges = Partial<Omit<NewUser, 'role'>>;

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    subject: row.subject,
    registration: row.registration,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLUMNS: Record<keyof UserChanges, string> = {
  name: 'name',
  email: 'email',
  passwordHash: 'password_hash',
  subject: 'subject',
  registration: 'registration',
};

export class UserRepository {
  constructor(private readonly db: Database) {}

  findById(id: number): UserRow | undefined {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  }

  findByEmail(email: string): UserRow | undefined {
    return this.db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email.trim()) as
      | UserRow
      | undefined;
  }

  list(role: Role, { limit, offset, q }: PageParams): { rows: UserRow[]; total: number } {
    const extra = role === 'teacher' ? 'subject' : 'registration';
    const filter = keywordFilter(q, ['name', 'email', extra]);
    const where = filter.sql ? `role = ? AND ${filter.sql}` : 'role = ?';

    const { total } = this.db
      .prepare(`SELECT COUNT(*) AS total FROM users WHERE ${where}`)
      .get(role, ...filter.params) as { total: number };

    const rows = this.db
      .prepare(
        `SELECT * FROM users WHERE ${where} ORDER BY name COLLATE NOCASE ASC, id ASC LIMIT ? OFFSET ?`,
      )
      .all(role, ...filter.params, limit, offset) as unknown as UserRow[];

    return { rows, total };
  }

  count(): number {
    const { total } = this.db.prepare('SELECT COUNT(*) AS total FROM users').get() as {
      total: number;
    };
    return total;
  }

  create(data: NewUser): UserRow {
    const timestamp = now();
    const result = this.db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, subject, registration, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.name,
        data.email.trim().toLowerCase(),
        data.passwordHash,
        data.role,
        data.subject ?? null,
        data.registration ?? null,
        timestamp,
        timestamp,
      );
    return this.findById(Number(result.lastInsertRowid))!;
  }

  update(id: number, changes: UserChanges): UserRow | undefined {
    const sets: string[] = [];
    const params: SQLInputValue[] = [];

    for (const [key, column] of Object.entries(COLUMNS) as [keyof UserChanges, string][]) {
      const value = changes[key];
      if (value === undefined) continue;
      sets.push(`${column} = ?`);
      params.push(key === 'email' && value ? value.trim().toLowerCase() : value);
    }

    if (sets.length > 0) {
      sets.push('updated_at = ?');
      params.push(now());
      this.db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
    }
    return this.findById(id);
  }

  delete(id: number): boolean {
    return Number(this.db.prepare('DELETE FROM users WHERE id = ?').run(id).changes) > 0;
  }
}
