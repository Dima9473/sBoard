/**
 * Копирует Skia WASM (с PDF backend) в public после npm install.
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'node_modules', '@rollerbird', 'canvaskit-wasm-pdf', 'bin');
/** public/ — Vite; canvaskit/ в корне — GitHub Pages с source «/ (root)» */
const destDirs = [
  join(root, 'public', 'canvaskit'),
  join(root, 'canvaskit'),
];

if (!existsSync(srcDir)) {
  console.warn('[copy-canvaskit] Пакет @rollerbird/canvaskit-wasm-pdf не найден, пропуск.');
  process.exit(0);
}

for (const destDir of destDirs) {
  mkdirSync(destDir, { recursive: true });
  for (const name of ['canvaskit-pdf.js', 'canvaskit-pdf.wasm']) {
    copyFileSync(join(srcDir, name), join(destDir, name));
  }
}
console.log('[copy-canvaskit] WASM → public/canvaskit/ и canvaskit/');
