import { now, type Database } from '../../db/database.js';

interface CommentRow {
  id: number;
  post_id: number;
  user_id: number | null;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number | null;
  authorName: string;
  content: string;
  createdAt: string;
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

export class CommentRepository {
  constructor(private readonly db: Database) {}

  /** Comentários de um post, do mais antigo para o mais novo. */
  listByPost(postId: number): Comment[] {
    const rows = this.db
      .prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC, id ASC')
      .all(postId) as unknown as CommentRow[];
    return rows.map(toComment);
  }

  findById(id: number): Comment | undefined {
    const row = this.db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as
      | CommentRow
      | undefined;
    return row ? toComment(row) : undefined;
  }

  create(
    data: { postId: number; userId: number | null; authorName: string; content: string },
    createdAt = now(),
  ): Comment {
    const result = this.db
      .prepare(
        'INSERT INTO comments (post_id, user_id, author_name, content, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(data.postId, data.userId, data.authorName, data.content, createdAt);
    return this.findById(Number(result.lastInsertRowid))!;
  }

  delete(id: number): boolean {
    return Number(this.db.prepare('DELETE FROM comments WHERE id = ?').run(id).changes) > 0;
  }
}
