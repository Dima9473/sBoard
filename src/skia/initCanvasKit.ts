import type { CanvasKit } from '@rollerbird/canvaskit-wasm-pdf';

/** Путь к Skia WASM с поддержкой PDF backend */
const CANVASKIT_BASE = '/canvaskit/';

type CanvasKitInitFn = (opts: { locateFile: (file: string) => string }) => Promise<CanvasKit>;

declare global {
  interface Window {
    CanvasKitInit?: CanvasKitInitFn;
  }
}

let canvasKitPromise: Promise<CanvasKit> | null = null;

function getCanvasKitInit(): CanvasKitInitFn {
  if (typeof window.CanvasKitInit === 'function') {
    return window.CanvasKitInit;
  }
  throw new Error(
    'CanvasKitInit не найден. Убедитесь, что /canvaskit/canvaskit-pdf.js подключён в index.html',
  );
}

/**
 * Загружает CanvasKit (Skia WASM + PDF). Результат кэшируется на время сессии.
 */
export function loadCanvasKit(): Promise<CanvasKit> {
  if (!canvasKitPromise) {
    const init = getCanvasKitInit();
    canvasKitPromise = init({
      locateFile: (file) => {
        if (file === 'canvaskit.wasm') {
          return `${CANVASKIT_BASE}canvaskit-pdf.wasm`;
        }
        return `${CANVASKIT_BASE}${file}`;
      },
    });
  }
  return canvasKitPromise;
}
