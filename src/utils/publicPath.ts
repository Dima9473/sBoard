/**
 * URL статики с учётом Vite base (локально `/`, на GitHub Pages `/sBoard/`).
 */
export function publicUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL;
  const path = relativePath.replace(/^\//, '');
  return `${base}${path}`;
}
