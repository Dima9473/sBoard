import * as PIXI from 'pixi.js-legacy';
import { SCENE_SIZE } from './scenes';

/**
 * Pixi Application с forceCanvas (CanvasRenderer) согласно ТЗ.
 */
export function createPixiApp(host: HTMLElement): PIXI.Application {
  const app = new PIXI.Application({
    width: SCENE_SIZE.width,
    height: SCENE_SIZE.height,
    backgroundColor: 0x1e2a3a,
    antialias: true,
    forceCanvas: true,
    resolution: 1,
  });

  host.appendChild(app.view as HTMLCanvasElement);
  return app;
}
