import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';

/** Vite + React: dev-сервер и сборка SPA с CanvasKit WASM в public */
export default defineConfig({
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
