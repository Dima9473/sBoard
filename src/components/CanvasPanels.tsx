import type { RefObject } from 'react';
import { SCENE_SIZE } from '../pixi/scenes';

interface CanvasPanelsProps {
  pixiHostRef: RefObject<HTMLDivElement | null>;
  skiaCanvasRef: RefObject<HTMLCanvasElement | null>;
}

/** Два канваса: Pixi и Skia */
export function CanvasPanels({ pixiHostRef, skiaCanvasRef }: CanvasPanelsProps) {
  return (
    <section className="canvases">
      <div className="canvas-panel">
        <h2>Pixi (CanvasRenderer)</h2>
        <div ref={pixiHostRef} className="canvas-host" />
      </div>
      <div className="canvas-panel">
        <h2>Skia (CanvasKit)</h2>
        <canvas
          ref={skiaCanvasRef}
          id="skia-canvas"
          width={SCENE_SIZE.width}
          height={SCENE_SIZE.height}
        />
      </div>
    </section>
  );
}
