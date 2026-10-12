import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import zaloMiniApp from 'zmp-vite-plugin';
import path from 'path';

// zmp-vite-plugin đọc ./app-config.json và xuất bản build vào www/ (định dạng `zmp deploy` cần).
export default defineConfig({
  plugins: [react(), tailwindcss(), zaloMiniApp()],
  resolve: {
    alias: {
      '@buoc-tiep/shared': path.resolve(__dirname, '../../packages/shared/src'),
      // Luật hiển thị thuần (không phụ thuộc DOM) dùng chung với web.
      '@web/lib': path.resolve(__dirname, '../web/src/lib'),
    },
  },
  server: { port: 3002 },
});
