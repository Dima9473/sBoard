import type { CanvasKit, Color } from '@rollerbird/canvaskit-wasm-pdf';

/** Преобразует цвет Pixi (число 0xRRGGBB) в Color4f для Skia */
export function pixiColorToSkia(
  CanvasKit: CanvasKit,
  color: number,
  alpha: number,
  tint: number = 0xffffff,
): Color {
  const r = ((color >> 16) & 0xff) / 255;
  const g = ((color >> 8) & 0xff) / 255;
  const b = (color & 0xff) / 255;
  const tr = ((tint >> 16) & 0xff) / 255;
  const tg = ((tint >> 8) & 0xff) / 255;
  const tb = (tint & 0xff) / 255;
  return CanvasKit.Color4f(r * tr, g * tg, b * tb, alpha);
}
