# Настройка GitHub Pages для sBoard

Сейчас в репозитории **две** копии сборки:

| Путь | Назначение |
|------|------------|
| `docs/` | полная сборка (рекомендуется для Pages) |
| `canvaskit/` в корне | WASM при source **main → / (root)** |

## Обязательно (рекомендуется)

**Settings → Pages → Build and deployment**

- **Source:** Deploy from a branch  
- **Branch:** `main`  
- **Folder:** `/docs` (не `/ (root)`)

Сайт: https://dima9473.github.io/sBoard/

## Если оставить `/ (root)`

Будет отдаваться dev-`index.html` с `/src/main.tsx` — приложение **не заработает**.  
Нужно переключить на **`/docs`** или **GitHub Actions** как source.

После смены на `/docs` подождите 1–2 минуты и обновите страницу (**Ctrl+Shift+R**).
