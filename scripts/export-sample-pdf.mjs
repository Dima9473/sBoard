/**
 * Генерирует пример векторного PDF через Skia PDF backend (для репозитория).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const binDir = join(root, 'vendor', 'canvaskit-wasm-pdf', 'bin');
const outDir = join(root, 'samples');

mkdirSync(outDir, { recursive: true });

const initUrl = pathToFileURL(join(binDir, 'canvaskit-pdf.js')).href;
const CanvasKitInit = (await import(initUrl)).default;

const CanvasKit = await CanvasKitInit({
  locateFile: (file) => {
    if (file === 'canvaskit.wasm') {
      return join(binDir, 'canvaskit-pdf.wasm');
    }
    return join(binDir, file);
  },
});

const doc = CanvasKit.MakePDFDocument({
  title: 'sBoard — пример векторного PDF',
  author: 'sBoard Pixi+Skia',
  subject: '',
  keywords: '',
  creator: 'sBoard',
  producer: 'Skia PDF backend',
  language: 'ru',
  rasterDPI: 72,
  PDFA: false,
  compressionLevel: CanvasKit.PDFCompressionLevel.Default,
  _rootTag: null,
});

const canvas = doc.beginPage(595, 420);
const paint = new CanvasKit.Paint();
paint.setAntiAlias(true);

// Красный эллипс
paint.setStyle(CanvasKit.PaintStyle.Fill);
paint.setColor(CanvasKit.Color4f(1, 0, 0, 1));
const ellipse = new CanvasKit.Path();
ellipse.addOval(CanvasKit.LTRBRect(80, 60, 280, 160));
canvas.drawPath(ellipse, paint);
ellipse.delete();

// Синий прямоугольник
paint.setColor(CanvasKit.Color4f(0, 0, 1, 0.9));
canvas.drawRect(CanvasKit.LTRBRect(120, 140, 220, 290), paint);

// Белая линия
paint.setStyle(CanvasKit.PaintStyle.Stroke);
paint.setStrokeWidth(10);
paint.setColor(CanvasKit.Color4f(1, 1, 1, 1));
const line = new CanvasKit.Path();
line.moveTo(50, 50);
line.lineTo(400, 200);
canvas.drawPath(line, paint);
line.delete();

paint.delete();
doc.endPage();
const pdf = doc.close();
doc.delete();

const outPath = join(outDir, 'sboard-demo-vector.pdf');
writeFileSync(outPath, pdf);
console.log('Сохранён:', outPath, `(${pdf.byteLength} байт)`);
