import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';

/** Нормализация base: всегда `/repo/` (без MSYS-ловушки `/sBoard/` → Program Files/Git/...) */
function normalizeBase(raw: string): string {
  let b = raw.trim().replace(/\\/g, '/');
  if (!b.startsWith('/')) b = `/${b}`;
  if (!b.endsWith('/')) b = `${b}/`;
  return b;
}

function resolveBase(): string {
  if (process.env.VITE_BASE_PATH) {
    return normalizeBase(process.env.VITE_BASE_PATH);
  }
  // На GitHub Actions GITHUB_REPOSITORY = owner/repo
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
    return normalizeBase(repo);
  }
  return '/';
}

const base = resolveBase();

/** Vite + React: dev-сервер и сборка SPA с CanvasKit WASM в public */
export default defineConfig({
  base,
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@rollerbird/canvaskit-wasm-pdf': resolve(
        __dirname,
        'vendor/canvaskit-wasm-pdf/bin/canvaskit-pdf.js',
      ),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  optimizeDeps: {
    exclude: ['@rollerbird/canvaskit-wasm-pdf'],
  },
});
