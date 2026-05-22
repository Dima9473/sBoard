import type { CanvasKit, Surface } from '@rollerbird/canvaskit-wasm-pdf';
import * as PIXI from 'pixi.js-legacy';
import { InteractionManager } from '../events/InteractionManager';
import { downloadPdf, exportSceneToPdf } from '../pdf/exportSceneToPdf';
import { createPixiApp } from '../pixi/PixiApp';
import { addRandomGraphic, loadAllScenes, SCENE_SIZE } from '../pixi/scenes';
import { loadCanvasKit } from '../skia/initCanvasKit';
import { PixiToSkiaConverter } from '../skia/PixiToSkiaConverter';

export interface SceneEntry {
  name: string;
  container: PIXI.Container;
}

/**
 * Ядро приложения: Pixi + Skia, сцены, события, PDF.
 * Инициализируется один раз и освобождается через dispose().
 */
export class PixiSkiaEngine {
  private app!: PIXI.Application;
  private CanvasKit!: CanvasKit;
  private converter!: PixiToSkiaConverter;
  private surface!: Surface;
  private stageRoot!: PIXI.Container;
  private scenes: SceneEntry[] = [];
  private sceneIndex = 0;
  private interaction!: InteractionManager;
  private tickerCb: (() => void) | null = null;

  constructor(private readonly log: (msg: string) => void) {}

  async init(pixiHost: HTMLElement, skiaCanvas: HTMLCanvasElement): Promise<void> {
    this.CanvasKit = await loadCanvasKit();
    this.converter = new PixiToSkiaConverter(this.CanvasKit);
    this.surface = this.CanvasKit.MakeCanvasSurface(skiaCanvas)!;
    if (!this.surface) {
      throw new Error('Не удалось создать Skia surface');
    }

    // Очистка host при повторной инициализации (React StrictMode)
    pixiHost.replaceChildren();
    this.app = createPixiApp(pixiHost);
    this.scenes = await loadAllScenes();
    this.stageRoot = new PIXI.Container();
    this.app.stage.addChild(this.stageRoot);

    this.interaction = new InteractionManager(this.stageRoot, this.log);
    this.interaction.attachSkiaCanvas(skiaCanvas, SCENE_SIZE.width, SCENE_SIZE.height);

    this.setScene(0);

    this.tickerCb = () => {
      const current = this.stageRoot.children[0];
      if (current) {
        this.converter.renderToSurface(current as PIXI.Container, this.surface);
      }
    };
    this.app.ticker.add(this.tickerCb);

    this.log('Приложение готово. Кликайте по объектам на любом из канвасов.');
  }

  getSceneLabel(): string {
    const s = this.scenes[this.sceneIndex];
    return s ? `${s.name} (${this.sceneIndex + 1}/${this.scenes.length})` : '';
  }

  getCurrentContainer(): PIXI.Container {
    return this.stageRoot.children[0] as PIXI.Container;
  }

  setScene(index: number): void {
    this.sceneIndex = ((index % this.scenes.length) + this.scenes.length) % this.scenes.length;
    this.stageRoot.removeChildren();
    const { container } = this.scenes[this.sceneIndex];
    this.stageRoot.addChild(container);
    this.app.render();
    this.converter.renderToSurface(container, this.surface);
    this.refreshInteraction();
  }

  prevScene(): void {
    this.setScene(this.sceneIndex - 1);
  }

  nextScene(): void {
    this.setScene(this.sceneIndex + 1);
  }

  addRandomShape(): void {
    const current = this.getCurrentContainer();
    addRandomGraphic(current);
    this.app.render();
    this.converter.renderToSurface(current, this.surface);
    this.refreshInteraction();
  }

  exportPdf(): void {
    const current = this.getCurrentContainer();
    current.updateTransform();
    const bytes = exportSceneToPdf(this.CanvasKit, current, {
      width: SCENE_SIZE.width,
      height: SCENE_SIZE.height,
      title: `sBoard — ${this.scenes[this.sceneIndex].name}`,
    });
    downloadPdf(bytes, `sboard-scene-${this.sceneIndex + 1}.pdf`);
    this.log(`PDF экспортирован (${bytes.byteLength} байт, векторный Skia PDF)`);
  }

  private refreshInteraction(): void {
    this.interaction.setRoot(this.getCurrentContainer());
    this.interaction.wirePixiLogging();
  }

  dispose(): void {
    if (this.tickerCb) {
      this.app?.ticker.remove(this.tickerCb);
      this.tickerCb = null;
    }
    this.converter?.dispose();
    this.surface?.delete();
    this.app?.destroy(true, { children: true });
  }
}
