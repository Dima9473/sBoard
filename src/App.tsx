import { useCallback, useRef, useState } from 'react';
import { CanvasPanels } from './components/CanvasPanels';
import { EventLog } from './components/EventLog';
import { Toolbar } from './components/Toolbar';
import { usePixiSkiaEngine } from './hooks/usePixiSkiaEngine';

/** Корневой компонент: UI + Pixi/Skia через хук */
export function App() {
  const pixiHostRef = useRef<HTMLDivElement>(null);
  const skiaCanvasRef = useRef<HTMLCanvasElement>(null);
  const [logLines, setLogLines] = useState<string[]>([]);

  const appendLog = useCallback((message: string) => {
    const line = `[${new Date().toLocaleTimeString()}] ${message}`;
    setLogLines((prev) => [line, ...prev].slice(0, 50));
    console.log(message);
  }, []);

  const { ready, sceneLabel, error, addRandomShape, prevScene, nextScene, exportPdf } =
    usePixiSkiaEngine({
      pixiHostRef,
      skiaCanvasRef,
      onLog: appendLog,
    });

  return (
    <>
      <header className="app-header">
        <h1>Pixi.js + Skia (CanvasKit WASM)</h1>
        <p className="subtitle">
          Двойной рендер сцены, события pointer на обоих канвасах, векторный PDF через Skia PDF
          backend
        </p>
        {error && <p className="error-banner">Ошибка: {error}</p>}
      </header>

      <Toolbar
        sceneLabel={sceneLabel}
        disabled={!ready}
        onRandom={addRandomShape}
        onPrevScene={prevScene}
        onNextScene={nextScene}
        onExportPdf={exportPdf}
      />

      <CanvasPanels pixiHostRef={pixiHostRef} skiaCanvasRef={skiaCanvasRef} />

      <EventLog lines={logLines} />
    </>
  );
}
