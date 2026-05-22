# sBoard — Pixi.js + Skia (тестовое задание)

Приложение на **React + TypeScript**, объединяющее **Pixi.js 7.2.4 (legacy, CanvasRenderer)** и **Skia** через **CanvasKit WASM** с **PDF backend**. Сцена рисуется на двух канвасах; экспорт в PDF — **векторный** (пути и заливки Skia, не растровая вставка).

## Возможности

- Обёртка `PixiToSkiaConverter` / `convertPixiContainerToSkia()` — обход `PIXI.Container` с `translate` / `rotate` / `scale`
- Поддержка `PIXI.Graphics` (rect, ellipse, polygon, линии) и `PIXI.Sprite` (PNG)
- Два канваса: Pixi (`forceCanvas: true`) и Skia (CanvasKit)
- События `pointerdown` / `pointerup` на обоих канвасах
- Кнопка «Случайная фигура / линия», переключение подготовленных сцен
- Экспорт PDF через `CanvasKit.MakePDFDocument` (Skia PDF backend)

## Требования

- Node.js 18+
- npm 9+

## Запуск

```bash
npm install
node scripts/generate-sample-png.mjs   # PNG для сцены со спрайтом (опционально, есть в public/)
npm run dev
```

Откройте http://localhost:5173

### Сборка и превью

```bash
npm run build
npm run preview
```

### Пример PDF в репозитории

```bash
node scripts/export-sample-pdf.mjs
```

Файл: `samples/sboard-demo-vector.pdf` — векторная графика, сгенерированная Skia PDF backend.

## Структура проекта

```
src/
  components/     # React UI (Toolbar, CanvasPanels, EventLog)
  hooks/          # usePixiSkiaEngine
  engine/         # PixiSkiaEngine (ядро без React)
  skia/           # Обёртка Pixi → Skia
  pdf/            # Экспорт в PDF
  pixi/           # Сцены и Pixi Application
  events/         # Pointer на обоих канвасах
  App.tsx         # Корневой компонент
  main.tsx        # Точка входа React
public/canvaskit/ # canvaskit-pdf.wasm (копируется postinstall)
vendor/           # @rollerbird/canvaskit-wasm-pdf (Skia + PDF WASM)
```

## GitHub Actions

| Workflow | Назначение |
|----------|------------|
| [CI](.github/workflows/ci.yml) | `typecheck` + `build` на push/PR в `main` |
| [Deploy GitHub Pages](.github/workflows/deploy-pages.yml) | публикация `dist/` после push в `main` |

**Демо после деплоя:** https://dima9473.github.io/sBoard/

Один раз в репозитории: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Локальная сборка с тем же base, что на Pages:

```bash
VITE_BASE_PATH=/sBoard/ npm run build
npm run preview
```

Синхронизация с GitHub:

```bash
npm run sync:github
```

## Деплой (альтернативы)

После `npm run build` можно загрузить `dist/` на [Netlify](https://www.netlify.com/), [Vercel](https://vercel.com/) или [Cloudflare Pages](https://pages.cloudflare.com/).

Убедитесь, что в `dist/canvaskit/` лежат `canvaskit-pdf.js` и `canvaskit-pdf.wasm`.

## Сдача задания

- Репозиторий на GitHub
- Ссылка на задеплоенное приложение
- PDF с векторной графикой (`samples/sboard-demo-vector.pdf` или экспорт из UI)

Форма: https://forms.yandex.ru/u/6a0db569eb6146662ae0fb45  
Контакт: @sboard_support_bot (Telegram)

## Технологии

| Компонент | Версия / пакет |
|-----------|----------------|
| UI | React 18 |
| Pixi | `pixi.js-legacy@7.2.4` |
| Skia WASM + PDF | `@rollerbird/canvaskit-wasm-pdf` (vendor) |
| Сборка | Vite + TypeScript |
