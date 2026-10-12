// D1 giả lập bằng node:sqlite (Node ≥ 22.5): chạy thật mọi migration, khóa ngoại, CHECK, trigger.
// Không có node:sqlite → `openMigratedD1()` trả null để test tự skip (dùng `describe.skipIf(!hasDb)`).
// Học từ an-tam (tests/helpers/sqlite-d1.ts).

/* eslint-disable @typescript-eslint/no-explicit-any */

const dyn = (name: string): Promise<any> => import(/* @vite-ignore */ name);

let sqliteMod: any | null | undefined;
async function sqlite(): Promise<any | null> {
  if (sqliteMod === undefined) {
    try {
      sqliteMod = await dyn('node:sqlite');
    } catch {
      sqliteMod = null;
    }
  }
  return sqliteMod;
}

export const hasSqlite = async (): Promise<boolean> => (await sqlite()) !== null;

const DB_DIR = new URL('../../packages/database/', import.meta.url);

/** packages/database/migrations/*.sql theo thứ tự tên file — đúng thứ tự `wrangler d1 migrations apply`. */
export async function readMigrations(): Promise<{ name: string; sql: string }[]> {
  const fs = await dyn('node:fs');
  const dir = new URL('migrations/', DB_DIR);
  return (fs.readdirSync(dir) as string[])
    .filter((n) => n.endsWith('.sql'))
    .sort()
    .map((name) => ({ name, sql: fs.readFileSync(new URL(name, dir), 'utf8') as string }));
}

const plain = (row: any) => (row ? { ...row } : null);
const returnsRows = (sql: string) => /^\s*(SELECT|WITH|PRAGMA)\b/i.test(sql) || /\bRETURNING\b/i.test(sql);

class Stmt {
  constructor(
    private readonly db: any,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...params: unknown[]) {
    return new Stmt(this.db, this.sql, params.map((p) => (p === undefined ? null : typeof p === 'boolean' ? Number(p) : p)));
  }

  async first<T>(col?: string): Promise<T | null> {
    const row = plain(this.db.prepare(this.sql).get(...this.params));
    return (row && col ? row[col] : row) as T | null;
  }

  async all<T>() {
    return this.exec() as { results: T[]; success: true; meta: any };
  }

  async run() {
    return this.exec();
  }

  async raw<T>() {
    return (this.db.prepare(this.sql).all(...this.params) as any[]).map((r) => Object.values(r)) as T[];
  }

  exec() {
    const stmt = this.db.prepare(this.sql);
    if (returnsRows(this.sql)) return { results: stmt.all(...this.params).map(plain), success: true, meta: { changes: 0 } };
    const r = stmt.run(...this.params);
    return { results: [], success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }
}

export interface TestD1 {
  d1: D1Database;
  raw: any;
}

/** DB trong bộ nhớ đã dựng đủ schema (khóa ngoại bật như D1). null nếu không có node:sqlite. */
export async function openMigratedD1(): Promise<TestD1 | null> {
  const mod = await sqlite();
  if (!mod) return null;
  const raw = new mod.DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON');
  for (const { sql } of await readMigrations()) raw.exec(sql);
  const d1 = {
    prepare: (sql: string) => new Stmt(raw, sql),
    batch: async (stmts: Stmt[]) => {
      raw.exec('BEGIN');
      try {
        const out = stmts.map((s) => s.exec());
        raw.exec('COMMIT');
        return out;
      } catch (err) {
        raw.exec('ROLLBACK');
        throw err;
      }
    },
    exec: async (sql: string) => {
      raw.exec(sql);
      return { count: 0, duration: 0 };
    },
  } as unknown as D1Database;
  return { d1, raw };
}
