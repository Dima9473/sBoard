import { publicUrl } from '../utils/publicPath';

/** Подключает canvaskit-pdf.js до инициализации Skia (пути с учётом GitHub Pages base) */
export function loadCanvasKitScript(): Promise<void> {
  if (typeof window.CanvasKitInit === 'function') {
    return Promise.resolve();
  }

  const src = publicUrl('canvaskit/canvaskit-pdf.js');
  const existing = document.querySelector(`script[data-canvaskit="1"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Не загружен ${src}`)));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.dataset.canvaskit = '1';
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Не загружен ${src}`));
    document.head.appendChild(script);
  });
}
