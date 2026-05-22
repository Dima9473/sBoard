import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { PixiSkiaEngine } from '../engine/PixiSkiaEngine';

interface UsePixiSkiaEngineOptions {
  pixiHostRef: RefObject<HTMLDivElement | null>;
  skiaCanvasRef: RefObject<HTMLCanvasElement | null>;
  onLog: (message: string) => void;
}

/** React-хук: инициализация Pixi+Skia при монтировании, очистка при размонтировании */
export function usePixiSkiaEngine({ pixiHostRef, skiaCanvasRef, onLog }: UsePixiSkiaEngineOptions) {
  const engineRef = useRef<PixiSkiaEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [sceneLabel, setSceneLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const syncLabel = useCallback(() => {
    if (engineRef.current) {
      setSceneLabel(engineRef.current.getSceneLabel());
    }
  }, []);

  useEffect(() => {
    const pixiHost = pixiHostRef.current;
    const skiaCanvas = skiaCanvasRef.current;
    if (!pixiHost || !skiaCanvas) return;

    let cancelled = false;
    const engine = new PixiSkiaEngine(onLog);
    engineRef.current = engine;

    engine
      .init(pixiHost, skiaCanvas)
      .then(() => {
        if (cancelled) {
          engine.dispose();
          return;
        }
        setReady(true);
        setError(null);
        syncLabel();
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        onLog(`Ошибка: ${msg}`);
      });

    return () => {
      cancelled = true;
      engine.dispose();
      engineRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- инициализация один раз после монтирования refs
  }, [onLog, syncLabel]);

  const addRandomShape = useCallback(() => {
    engineRef.current?.addRandomShape();
    syncLabel();
  }, [syncLabel]);

  const prevScene = useCallback(() => {
    engineRef.current?.prevScene();
    syncLabel();
  }, [syncLabel]);

  const nextScene = useCallback(() => {
    engineRef.current?.nextScene();
    syncLabel();
  }, [syncLabel]);

  const exportPdf = useCallback(() => {
    engineRef.current?.exportPdf();
  }, []);

  return {
    ready,
    sceneLabel,
    error,
    addRandomShape,
    prevScene,
    nextScene,
    exportPdf,
  };
}
