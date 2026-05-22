/**
 * Копирует Skia WASM (с PDF backend) из vendor в public/ после npm install.
 * Единственная рабочая копия для dev/build; в git не хранится (см. .gitignore).
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'node_modules', '@rollerbird', 'canvaskit-wasm-pdf', 'bin');
const destDir = join(root, 'public', 'canvaskit');

if (!existsSync(srcDir)) {
  console.warn('[copy-canvaskit] Пакет @rollerbird/canvaskit-wasm-pdf не найден, пропуск.');
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
for (const name of ['canvaskit-pdf.js', 'canvaskit-pdf.wasm']) {
  copyFileSync(join(srcDir, name), join(destDir, name));
}
console.log('[copy-canvaskit] WASM скопирован в public/canvaskit/');
