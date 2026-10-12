import { describe, expect, it } from 'vitest';
import { hasSqlite, openMigratedD1, readMigrations } from '../helpers/sqlite-d1';

const hasDb = await hasSqlite();
const migrations = await readMigrations();

describe('Migration — đánh số', () => {
  it('số tăng dần liên tục, không trùng (lấy số lớn nhất + 1 khi thêm mới)', () => {
    const nums = migrations.map((m) => Number(m.name.slice(0, 4)));
    expect(nums).toEqual(nums.map((_, i) => i));
  });

  it('bảng vòng khép kín và đăng ký tham gia nằm trong migration, chỉ dùng IF NOT EXISTS (an toàn với DB remote đã có bảng)', () => {
    for (const prefix of ['0008', '0009']) {
      const sql = migrations.find((m) => m.name.startsWith(prefix))?.sql ?? '';
      expect(sql, prefix).toMatch(/CREATE TABLE IF NOT EXISTS/);
      expect(sql, prefix).not.toMatch(/CREATE (TABLE|INDEX|UNIQUE INDEX) (?!IF NOT EXISTS)/);
    }
  });
});

describe.skipIf(!hasDb)('Schema D1 — dựng được từ migration trên DB trống', () => {
  it('có đủ bảng vòng khép kín, đăng ký tham gia và stack cũ', async () => {
    const t = (await openMigratedD1())!;
    const { results } = await t.d1.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>();
    const names = new Set(results.map((r) => r.name));
    for (const table of ['loop_cases', 'loop_referrals', 'loop_follow_ups', 'nx_accounts', 'email_otps', 'users', 'cases']) {
      expect(names.has(table), table).toBe(true);
    }
  });

  it('batch là một transaction: lỗi ở giữa thì rollback cả batch', async () => {
    const t = (await openMigratedD1())!;
    const ok = t.d1.prepare("INSERT INTO nx_accounts (id, email, role, status) VALUES ('acc-1', 'a@x.vn', 'applicant', 'ACTIVE')");
    const dup = t.d1.prepare("INSERT INTO nx_accounts (id, email, role, status) VALUES ('acc-1', 'b@x.vn', 'applicant', 'ACTIVE')");
    await expect(t.d1.batch([ok, dup])).rejects.toThrow();
    expect(await t.d1.prepare('SELECT COUNT(*) AS n FROM nx_accounts').first<number>('n')).toBe(0);
  });
});
