import type { CanvasKit } from '@rollerbird/canvaskit-wasm-pdf';
import * as PIXI from 'pixi.js-legacy';
import { PixiToSkiaConverter } from '../skia/PixiToSkiaConverter';

export interface PdfExportOptions {
  width: number;
  height: number;
  title?: string;
  author?: string;
}

/**
 * Экспорт сцены в векторный PDF через Skia PDF backend (MakePDFDocument).
 * Геометрия передаётся как пути/штрихи, а не растровая вставка.
 */
export function exportSceneToPdf(
  CanvasKit: CanvasKit,
  container: PIXI.Container,
  options: PdfExportOptions,
): Uint8Array {
  const { width, height, title = 'sBoard Scene', author = 'sBoard Pixi+Skia' } = options;

  const doc = CanvasKit.MakePDFDocument({
    title,
    author,
    subject: '',
    keywords: '',
    creator: 'sBoard',
    producer: 'Skia PDF backend (CanvasKit WASM)',
    language: 'ru',
    rasterDPI: 72,
    PDFA: false,
    compressionLevel: CanvasKit.PDFCompressionLevel.Default,
    _rootTag: null,
  } as Parameters<CanvasKit['MakePDFDocument']>[0]);

  const pageCanvas = doc.beginPage(width, height);
  const converter = new PixiToSkiaConverter(CanvasKit);
  converter.convertPixiContainerToSkia(container, pageCanvas);
  converter.dispose();

  doc.endPage();
  const pdfBytes = doc.close();
  doc.delete();

  return pdfBytes;
}

/** Скачивание PDF в браузере */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
