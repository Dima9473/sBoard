import type { CanvasKit, Path } from '@rollerbird/canvaskit-wasm-pdf';
import * as PIXI from 'pixi.js-legacy';

/** Типы фигур Pixi Graphics (совпадают с SHAPES в рантайме) */
const SHAPES = {
  POLY: 0,
  RECT: 1,
  CIRC: 2,
  ELIP: 3,
  RREC: 4,
} as const;

/**
 * Строит Skia Path из одной записи graphicsData (аналог CanvasGraphicsRenderer).
 */
export function buildPathFromGraphicsData(
  CanvasKit: CanvasKit,
  data: PIXI.GraphicsData,
): Path | null {
  const shape = data.shape;
  const path = new CanvasKit.Path();

  if (shape.type === SHAPES.POLY) {
    const points = shape.points;
    if (!points || points.length < 2) {
      path.delete();
      return null;
    }
    path.moveTo(points[0], points[1]);
    for (let j = 2; j < points.length; j += 2) {
      path.lineTo(points[j], points[j + 1]);
    }
    if (shape.closeStroke) {
      path.close();
    }
    appendHoles(CanvasKit, path, data, points);
  } else if (shape.type === SHAPES.RECT) {
    path.addRect([shape.x, shape.y, shape.x + shape.width, shape.y + shape.height]);
  } else if (shape.type === SHAPES.CIRC) {
    path.addCircle(shape.x, shape.y, shape.radius);
  } else if (shape.type === SHAPES.ELIP) {
    addEllipseToPath(path, shape as PIXI.Ellipse);
  } else if (shape.type === SHAPES.RREC) {
    addRoundedRectToPath(CanvasKit, path, shape as PIXI.RoundedRectangle);
  } else {
    path.delete();
    return null;
  }

  return path;
}

/** Эллипс через кубические Безье (как в Pixi Canvas renderer) */
function addEllipseToPath(path: Path, shape: PIXI.Ellipse): void {
  const w = shape.width * 2;
  const h = shape.height * 2;
  const x = shape.x - w / 2;
  const y = shape.y - h / 2;
  const kappa = 0.5522848;
  const ox = (w / 2) * kappa;
  const oy = (h / 2) * kappa;
  const xe = x + w;
  const ye = y + h;
  const xm = x + w / 2;
  const ym = y + h / 2;

  path.moveTo(x, ym);
  path.cubicTo(x, ym - oy, xm - ox, y, xm, y);
  path.cubicTo(xm + ox, y, xe, ym - oy, xe, ym);
  path.cubicTo(xe, ym + oy, xm + ox, ye, xm, ye);
  path.cubicTo(xm - ox, ye, x, ym + oy, x, ym);
  path.close();
}

function addRoundedRectToPath(CanvasKit: CanvasKit, path: Path, shape: PIXI.RoundedRectangle): void {
  const rx = shape.x;
  const ry = shape.y;
  const width = shape.width;
  const height = shape.height;
  let radius = shape.radius;
  const maxRadius = Math.min(width, height) / 2;
  radius = radius > maxRadius ? maxRadius : radius;
  path.addRRect(
    CanvasKit.RRectXY(
      CanvasKit.LTRBRect(rx, ry, rx + width, ry + height),
      radius,
      radius,
    ),
  );
}

function appendHoles(CanvasKit: CanvasKit, path: Path, data: PIXI.GraphicsData, outerPoints: number[]): void {
  const holes = data.holes;
  if (!holes?.length) return;

  let outerArea = 0;
  let px = outerPoints[0];
  let py = outerPoints[1];
  for (let j = 2; j + 2 < outerPoints.length; j += 2) {
    outerArea +=
      (outerPoints[j] - px) * (outerPoints[j + 3] - py) -
      (outerPoints[j + 2] - px) * (outerPoints[j + 1] - py);
  }

  for (const hole of holes) {
    const holeShape = hole.shape as PIXI.Polygon;
    const points = holeShape.points;
    if (!points) continue;
    let innerArea = 0;
    px = points[0];
    py = points[1];
    for (let j = 2; j + 2 < points.length; j += 2) {
      innerArea +=
        (points[j] - px) * (points[j + 3] - py) -
        (points[j + 2] - px) * (points[j + 1] - py);
    }
    if (innerArea * outerArea < 0) {
      path.moveTo(points[0], points[1]);
      for (let j = 2; j < points.length; j += 2) {
        path.lineTo(points[j], points[j + 1]);
      }
    } else {
      path.moveTo(points[points.length - 2], points[points.length - 1]);
      for (let j = points.length - 4; j >= 0; j -= 2) {
        path.lineTo(points[j], points[j + 1]);
      }
    }
    if (holeShape.closeStroke) {
      path.close();
    }
  }
}

// Fix: RRectXY needs CanvasKit in scope - shapeToPath uses CanvasKit from parameter
// I used CanvasKit.RRectXY without passing - need to fix addRoundedRectToPath
