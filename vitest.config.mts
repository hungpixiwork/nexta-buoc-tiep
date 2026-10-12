import { configDefaults, defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      // Luật hiển thị thuần của web mà Zalo Mini App dùng chung (xem apps/zalo/vite.config.ts).
      '@web/lib': fileURLToPath(new URL('./apps/web/src/lib', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    // Bỏ qua worktree của subagent và mã giao diện (web/app test riêng khi cần).
    exclude: [...configDefaults.exclude, '.claude/**', 'apps/**'],
  },
});
