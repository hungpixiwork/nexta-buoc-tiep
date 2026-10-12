// Mã web/Mini App dùng chung trong test đọc import.meta.env (Vite/Vitest đều cung cấp).
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
