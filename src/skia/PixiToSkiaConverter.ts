import type { Canvas, CanvasKit, Paint, Surface } from '@rollerbird/canvaskit-wasm-pdf';
import * as PIXI from 'pixi.js-legacy';
import { pixiColorToSkia } from './colorUtils';
import { buildPathFromGraphicsData } from './shapeToPath';

/** Интерфейс обёртки Skia: принимает PIXI.Container и рисует на Skia Canvas */
export interface ISkiaRenderer {
  /** Отрисовка дерева Pixi на Skia-холсте */
  convertPixiContainerToSkia(container: PIXI.Container, canvas: Canvas): void;
  /** Отрисовка на Skia Surface (экран) */
  renderToSurface(container: PIXI.Container, surface: Surface): void;
}

/**
 * Конвертер Pixi → Skia: обходит DisplayObject-дерево с учётом worldTransform,
 * поддерживает PIXI.Graphics и PIXI.Sprite.
 */
export class PixiToSkiaConverter implements ISkiaRenderer {
  private readonly imageCache = new Map<number, ReturnType<CanvasKit['MakeImageFromEncoded']>>();

  constructor(private readonly CanvasKit: CanvasKit) {}

  convertPixiContainerToSkia(container: PIXI.Container, canvas: Canvas): void {
    canvas.clear(this.CanvasKit.WHITE);
    this.renderContainer(container, canvas);
  }

  renderToSurface(container: PIXI.Container, surface: Surface): void {
    const canvas = surface.getCanvas();
    this.convertPixiContainerToSkia(container, canvas);
    surface.flush();
  }

  private renderContainer(container: PIXI.Container, canvas: Canvas): void {
    container.updateTransform();
    for (const child of container.children) {
      if (!child.visible) continue;
      this.renderDisplayObject(child, canvas);
    }
  }

  private renderDisplayObject(obj: PIXI.DisplayObject, canvas: Canvas): void {
    if (obj instanceof PIXI.Container && !(obj instanceof PIXI.Graphics) && !(obj instanceof PIXI.Sprite)) {
      canvas.save();
      this.applyWorldTransform(canvas, obj);
      this.renderContainer(obj, canvas);
      canvas.restore();
      return;
    }

    if (obj instanceof PIXI.Graphics) {
      this.renderGraphics(obj, canvas);
      return;
    }

    if (obj instanceof PIXI.Sprite) {
      this.renderSprite(obj, canvas);
      return;
    }

    if (obj instanceof PIXI.Container) {
      canvas.save();
      this.applyWorldTransform(canvas, obj);
      this.renderContainer(obj, canvas);
      canvas.restore();
    }
  }

  private renderGraphics(graphics: PIXI.Graphics, canvas: Canvas): void {
    graphics.finishPoly?.();
    const graphicsData = graphics.geometry.graphicsData;
    if (!graphicsData.length) return;

    const worldAlpha = graphics.worldAlpha;
    const tint = graphics.tint;
    const world = graphics.worldTransform;
    const tempMatrix = new PIXI.Matrix();

    for (let i = 0; i < graphicsData.length; i++) {
      const data = graphicsData[i];
      canvas.save();

      let matrix = world;
      if (data.matrix) {
        matrix = tempMatrix.copyFrom(world).append(data.matrix);
      }
      this.concatMatrix(canvas, matrix);

      const path = buildPathFromGraphicsData(this.CanvasKit, data);
      if (!path) {
        canvas.restore();
        continue;
      }

      const fillStyle = data.fillStyle;
      const lineStyle = data.lineStyle;

      if (fillStyle?.visible) {
        const fillPaint = new this.CanvasKit.Paint();
        fillPaint.setStyle(this.CanvasKit.PaintStyle.Fill);
        fillPaint.setAntiAlias(true);
        fillPaint.setColor(
          pixiColorToSkia(this.CanvasKit, fillStyle.color, fillStyle.alpha * worldAlpha, tint),
        );
        canvas.drawPath(path, fillPaint);
        fillPaint.delete();
      }

      if (lineStyle?.visible && lineStyle.width > 0) {
        const strokePaint = new this.CanvasKit.Paint();
        strokePaint.setStyle(this.CanvasKit.PaintStyle.Stroke);
        strokePaint.setAntiAlias(true);
        strokePaint.setStrokeWidth(lineStyle.width);
        strokePaint.setColor(
          pixiColorToSkia(this.CanvasKit, lineStyle.color, lineStyle.alpha * worldAlpha, tint),
        );
        canvas.drawPath(path, strokePaint);
        strokePaint.delete();
      }

      path.delete();
      canvas.restore();
    }
  }

  private renderSprite(sprite: PIXI.Sprite, canvas: Canvas): void {
    const texture = sprite.texture;
    if (!texture || texture === PIXI.Texture.EMPTY) return;

    const image = this.getOrCreateImage(sprite);
    if (!image) return;

    canvas.save();
    this.applyWorldTransform(canvas, sprite);

    const frame = texture.frame;
    const w = frame.width;
    const h = frame.height;
    const ox = sprite.anchor.x * w;
    const oy = sprite.anchor.y * h;

    const src: [number, number, number, number] = [frame.x, frame.y, frame.x + w, frame.y + h];
    const dst: [number, number, number, number] = [-ox, -oy, w - ox, h - oy];

    const paint = new this.CanvasKit.Paint();
    paint.setAntiAlias(true);
    const alpha = sprite.worldAlpha;
    if (alpha < 1) {
      paint.setAlphaf(alpha);
    }

    canvas.drawImageRect(image, src, dst, paint, false);
    paint.delete();
    canvas.restore();
  }

  private getOrCreateImage(sprite: PIXI.Sprite) {
    const texture = sprite.texture;
    const base = texture.baseTexture;
    const key = base.uid;

    if (this.imageCache.has(key)) {
      return this.imageCache.get(key)!;
    }

    const source = (base.resource as { source?: HTMLImageElement | HTMLCanvasElement } | undefined)
      ?.source;
    if (!source) return null;

    let bytes: Uint8Array | null = null;

    if (source instanceof HTMLImageElement && source.complete) {
      const c = document.createElement('canvas');
      c.width = source.naturalWidth || source.width;
      c.height = source.naturalHeight || source.height;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(source, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      bytes = new Uint8Array(imageData.data.buffer);
      const img = this.CanvasKit.MakeImage(
        {
          width: c.width,
          height: c.height,
          alphaType: this.CanvasKit.AlphaType.Unpremul,
          colorType: this.CanvasKit.ColorType.RGBA_8888,
          colorSpace: this.CanvasKit.ColorSpace.SRGB,
        },
        bytes,
        c.width * 4,
      );
      if (img) this.imageCache.set(key, img);
      return img;
    }

    if (source instanceof HTMLCanvasElement) {
      const imageData = source.getContext('2d')?.getImageData(0, 0, source.width, source.height);
      if (!imageData) return null;
      bytes = new Uint8Array(imageData.data.buffer);
      const img = this.CanvasKit.MakeImage(
        {
          width: source.width,
          height: source.height,
          alphaType: this.CanvasKit.AlphaType.Unpremul,
          colorType: this.CanvasKit.ColorType.RGBA_8888,
          colorSpace: this.CanvasKit.ColorSpace.SRGB,
        },
        bytes,
        source.width * 4,
      );
      if (img) this.imageCache.set(key, img);
      return img;
    }

    return null;
  }

  private applyWorldTransform(canvas: Canvas, obj: PIXI.DisplayObject): void {
    this.concatMatrix(canvas, obj.worldTransform);
  }

  /** Pixi Matrix → Skia 3×3 (column-major) */
  private concatMatrix(canvas: Canvas, matrix: PIXI.Matrix): void {
    canvas.concat([matrix.a, matrix.c, matrix.tx, matrix.b, matrix.d, matrix.ty, 0, 0, 1]);
  }

  dispose(): void {
    for (const img of this.imageCache.values()) {
      img?.delete();
    }
    this.imageCache.clear();
  }
}

/** Функция из ТЗ: конвертация контейнера Pixi в отрисовку Skia */
export function convertPixiContainerToSkia(
  converter: ISkiaRenderer,
  container: PIXI.Container,
  canvas: Canvas,
): void {
  converter.convertPixiContainerToSkia(container, canvas);
}
