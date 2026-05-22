import * as PIXI from 'pixi.js-legacy';

export type PointerLogFn = (message: string) => void;

/**
 * Единая обработка pointerdown/pointerup для Pixi-канваса и Skia-канваса.
 * На Skia выполняется hit-test по bounds объектов с eventMode !== 'none'.
 */
export class InteractionManager {
  private root: PIXI.Container;

  constructor(
    root: PIXI.Container,
    private readonly log: PointerLogFn,
  ) {
    this.root = root;
  }

  /** Обновить корень сцены после переключения контейнеров */
  setRoot(root: PIXI.Container): void {
    this.root = root;
  }

  /** Подключает события к Skia canvas (координаты в пространстве сцены) */
  attachSkiaCanvas(canvas: HTMLCanvasElement, sceneWidth: number, sceneHeight: number): void {
    const toScene = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = sceneWidth / rect.width;
      const scaleY = sceneHeight / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    canvas.addEventListener('pointerdown', (e) => {
      const { x, y } = toScene(e);
      const target = this.hitTest(this.root, x, y);
      if (target) {
        this.log(`[Skia] pointerdown → ${this.describe(target)}`);
        target.emit('pointerdown', this.makeEvent(target, x, y));
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      const { x, y } = toScene(e);
      const target = this.hitTest(this.root, x, y);
      if (target) {
        this.log(`[Skia] pointerup → ${this.describe(target)}`);
        target.emit('pointerup', this.makeEvent(target, x, y));
      }
    });
  }

  /** Логирование событий с Pixi (уже обрабатываются EventSystem) */
  wirePixiLogging(): void {
    this.walk(this.root, (obj) => {
      if (obj.eventMode === 'none') return;
      const tagged = obj as PIXI.DisplayObject & { _sboardWired?: boolean };
      if (tagged._sboardWired) return;
      tagged._sboardWired = true;
      obj.on('pointerdown', () => {
        this.log(`[Pixi] pointerdown → ${this.describe(obj)}`);
      });
      obj.on('pointerup', () => {
        this.log(`[Pixi] pointerup → ${this.describe(obj)}`);
      });
    });
  }

  private hitTest(container: PIXI.Container, x: number, y: number): PIXI.DisplayObject | null {
    container.updateTransform();
    for (let i = container.children.length - 1; i >= 0; i--) {
      const child = container.children[i];
      if (!child.visible || child.eventMode === 'none') continue;

      if (child instanceof PIXI.Container && child.children.length > 0) {
        const nested = this.hitTest(child, x, y);
        if (nested) return nested;
      }

      const bounds = child.getBounds();
      if (bounds.contains(x, y)) {
        return child;
      }
    }
    return null;
  }

  private walk(container: PIXI.Container, fn: (o: PIXI.DisplayObject) => void): void {
    for (const child of container.children) {
      fn(child);
      if (child instanceof PIXI.Container) {
        this.walk(child, fn);
      }
    }
  }

  private describe(obj: PIXI.DisplayObject): string {
    return obj.name || obj.constructor.name;
  }

  private makeEvent(target: PIXI.DisplayObject, x: number, y: number): PIXI.FederatedPointerEvent {
    return {
      type: 'pointerdown',
      global: new PIXI.Point(x, y),
      getLocalPosition: () => target.toLocal(new PIXI.Point(x, y)),
    } as unknown as PIXI.FederatedPointerEvent;
  }
}
