import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadCanvasKitScript } from './skia/loadCanvasKitScript';
import './styles/main.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Элемент #root не найден');
}

/** Сначала WASM CanvasKit, затем React (иначе 404 на Pages из-за путей в index.html) */
loadCanvasKitScript()
  .then(() => {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    rootEl.innerHTML = `<p style="color:#c00;padding:1rem">Ошибка загрузки CanvasKit: ${msg}</p>`;
    console.error(err);
  });
