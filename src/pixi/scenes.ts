import * as PIXI from 'pixi.js-legacy';

export const SCENE_SIZE = { width: 800, height: 600 };

/** Делает объект интерактивным для pointer-событий */
function makeInteractive(obj: PIXI.DisplayObject, name: string): void {
  obj.eventMode = 'static';
  obj.cursor = 'pointer';
  obj.name = name;
}

/**
 * Демо-сцена из ТЗ: эллипс, прямоугольник, линии во вложенном контейнере.
 */
export function createAssignmentScene(): PIXI.Container {
  const mainContainer = new PIXI.Container();

  const subContainer = new PIXI.Container();
  const g1 = new PIXI.Graphics();
  const g2 = new PIXI.Graphics();
  const g3 = new PIXI.Graphics();
  const g4 = new PIXI.Graphics();

  g1.beginFill(0xff0000).drawEllipse(0, 0, 200, 100).endFill();
  g1.position.set(200, 100);
  g1.angle = 30;
  makeInteractive(g1, 'g1');
  g1.on('pointerdown', () => console.log('g1 pointerdown!'));

  g2.beginFill(0x0000ff).drawRect(-50, -75, 100, 150).endFill();
  g2.position.set(120, 60);
  g2.angle = 15;
  g2.scale.set(1.5, 1.7);
  makeInteractive(g2, 'g2');
  g2.on('pointerup', () => console.log('g2 pointerup!'));

  g3.lineStyle(10, 0xffffff, 1).moveTo(0, 0).lineTo(150, 100);
  g3.angle = -20;
  makeInteractive(g3, 'g3');

  g4.lineStyle(10, 0xffff00, 1).moveTo(0, 70).lineTo(150, -30);
  g4.angle = 20;
  makeInteractive(g4, 'g4');

  subContainer.position.set(75, 50);
  subContainer.addChild(g3, g4);
  mainContainer.addChild(subContainer, g1, g2);

  return mainContainer;
}

/** Вторая сцена: круги и звезда-подобный полигон */
export function createShapesScene(): PIXI.Container {
  const root = new PIXI.Container();

  const circle = new PIXI.Graphics();
  circle.beginFill(0x00aa88).drawCircle(0, 0, 80).endFill();
  circle.position.set(150, 200);
  makeInteractive(circle, 'circle');

  const star = new PIXI.Graphics();
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 70 : 35;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  star.beginFill(0xff8800).drawPolygon(pts).endFill();
  star.position.set(450, 280);
  star.angle = 12;
  makeInteractive(star, 'star');

  const line = new PIXI.Graphics();
  line.lineStyle(8, 0xcc66ff, 1).moveTo(-100, 0).lineTo(120, -60).lineTo(200, 40);
  line.position.set(500, 120);
  makeInteractive(line, 'zigzag');

  root.addChild(circle, star, line);
  return root;
}

/** Третья сцена: спрайт (текстура из PNG или процедурная) + рамка */
export async function createSpriteScene(): Promise<PIXI.Container> {
  const root = new PIXI.Container();

  let texture: PIXI.Texture;
  try {
    texture = await PIXI.Assets.load('/assets/sample.png');
  } catch {
    // Fallback: «PNG» через generateTexture, если файл недоступен
    const icon = new PIXI.Graphics();
    icon.beginFill(0xff66aa).drawCircle(0, 0, 48).endFill();
    icon.beginFill(0xffffff, 0.35).drawCircle(-16, -16, 14).endFill();
    const tempRenderer = new PIXI.CanvasRenderer({ width: 128, height: 128 });
    texture = tempRenderer.generateTexture(icon);
    tempRenderer.destroy();
    icon.destroy();
  }

  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.position.set(400, 280);
  sprite.scale.set(1.2);
  makeInteractive(sprite, 'sprite');

  const frame = new PIXI.Graphics();
  frame.lineStyle(4, 0x66ccff, 1).drawRect(-140, -100, 280, 200);
  frame.position.set(400, 280);
  makeInteractive(frame, 'frame');

  root.addChild(sprite, frame);
  return root;
}

/** Все подготовленные сцены для переключения */
export async function loadAllScenes(): Promise<{ name: string; container: PIXI.Container }[]> {
  return [
    { name: 'Демо из ТЗ', container: createAssignmentScene() },
    { name: 'Фигуры', container: createShapesScene() },
    { name: 'Спрайт PNG', container: await createSpriteScene() },
  ];
}

/** Случайная фигура или линия в контейнер */
export function addRandomGraphic(container: PIXI.Container): void {
  const g = new PIXI.Graphics();
  const palette = [0xff4444, 0x44ff44, 0x4488ff, 0xffcc00, 0xff66cc];
  const color = palette[Math.floor(Math.random() * palette.length)];

  if (Math.random() > 0.45) {
    const w = 8 + Math.random() * 12;
    g.lineStyle(w, color, 1);
    g.moveTo(0, 0).lineTo(40 + Math.random() * 160, 20 + Math.random() * 120);
    makeInteractive(g, 'random-line');
  } else {
    g.beginFill(color, 0.85);
    if (Math.random() > 0.5) {
      g.drawEllipse(0, 0, 25 + Math.random() * 90, 20 + Math.random() * 55);
    } else {
      const hw = 30 + Math.random() * 70;
      const hh = 25 + Math.random() * 60;
      g.drawRect(-hw / 2, -hh / 2, hw, hh);
    }
    g.endFill();
    makeInteractive(g, 'random-shape');
  }

  g.position.set(80 + Math.random() * 620, 60 + Math.random() * 480);
  g.angle = Math.random() * 360;
  g.scale.set(0.7 + Math.random() * 0.8);
  container.addChild(g);
}
