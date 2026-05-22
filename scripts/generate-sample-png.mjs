/**
 * Генерирует простой PNG для демо PIXI.Sprite (валидный 2×2 PNG).
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'assets');
mkdirSync(outDir, { recursive: true });

// Минимальный валидный PNG 2×2 (красный)
const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVQIHWP4z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

writeFileSync(join(outDir, 'sample.png'), Buffer.from(pngBase64, 'base64'));
console.log('sample.png создан');
