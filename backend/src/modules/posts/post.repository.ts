import type { SQLInputValue } from 'node:sqlite';
import { now, type Database } from '../../db/database.js';
import type { PageParams } from '../../utils/pagination.js';
import { keywordFilter } from '../../utils/search.js';

interface PostRow {
  id: number;
  title: string;
  content: string;
  author: string;
  author_id: number | null;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId: number | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewPost {
  title: string;
  content: string;
  author: string;
  authorId: number | null;
}

export type PostChanges = Partial<Pick<NewPost, 'title' | 'content' | 'author'>>;

const SELECT_POSTS = `
  SELECT p.*, (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
  FROM posts p`;

function toPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    author: row.author,
    authorId: row.author_id,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostRepository {
  constructor(private readonly db: Database) {}

  /** Lista paginada, mais recentes primeiro. `q` filtra por palavras-chave. */
  list({ limit, offset, q }: PageParams): { posts: Post[]; total: number } {
    const filter = keywordFilter(q, ['p.title', 'p.content', 'p.author']);
    const where = filter.sql ? `WHERE ${filter.sql}` : '';

    const { total } = this.db
      .prepare(`SELECT COUNT(*) AS total FROM posts p ${where}`)
      .get(...filter.params) as { total: number };

    const rows = this.db
      .prepare(`${SELECT_POSTS} ${where} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`)
      .all(...filter.params, limit, offset) as unknown as PostRow[];

    return { posts: rows.map(toPost), total };
  }

  findById(id: number): Post | undefined {
    const row = this.db.prepare(`${SELECT_POSTS} WHERE p.id = ?`).get(id) as PostRow | undefined;
    return row ? toPost(row) : undefined;
  }

  create(data: NewPost, createdAt = now()): Post {
    const result = this.db
      .prepare(
        `INSERT INTO posts (title, content, author, author_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(data.title, data.content, data.author, data.authorId, createdAt, createdAt);
    return this.findById(Number(result.lastInsertRowid))!;
  }

  update(id: number, changes: PostChanges): Post | undefined {
    const sets: string[] = [];
    const params: SQLInputValue[] = [];
    for (const key of ['title', 'content', 'author'] as const) {
      if (changes[key] === undefined) continue;
      sets.push(`${key} = ?`);
      params.push(changes[key]);
    }
    if (sets.length > 0) {
      sets.push('updated_at = ?');
      params.push(now());
      this.db.prepare(`UPDATE posts SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
    }
    return this.findById(id);
  }

  delete(id: number): boolean {
    return Number(this.db.prepare('DELETE FROM posts WHERE id = ?').run(id).changes) > 0;
  }
}
