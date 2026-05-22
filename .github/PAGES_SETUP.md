# GitHub Pages для sBoard

## Настройка (один раз)

**Settings → Pages → Build and deployment → Source: GitHub Actions**

Не используйте «Deploy from branch» (`/docs` или `/`) — иначе в репозитории появляются дубликаты сборки.

## Деплой

После push в `main` workflow **Deploy GitHub Pages** публикует папку `dist/` (артефакт Actions).

Сайт: https://dima9473.github.io/sBoard/

## Локально

```bash
npm install   # postinstall → public/canvaskit/ (в .gitignore)
npm run build # → dist/
```

Источник WASM: `vendor/canvaskit-wasm-pdf/bin/` (пакет npm `file:vendor/...`).
