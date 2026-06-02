/**
 * An alien invader, inlined as an SVG so it ships with the package without any
 * bundler asset handling. The body tint follows the configurable invader
 * colour; the eyes take the background colour so they read as cut-outs against
 * the playfield.
 */
export function alienSvg(body: string, eye: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M8 3 L9 7 M16 3 L15 7" stroke="${body}" stroke-width="1.5" stroke-linecap="round" fill="none" />
  <path d="M5 10 a7 6 0 0 1 14 0 v4 l-2 2 l-2 -2 l-2 2 l-2 -2 l-2 2 l-2 -2 l-2 2 z" fill="${body}" />
  <circle cx="9.5" cy="11" r="1.5" fill="${eye}" />
  <circle cx="14.5" cy="11" r="1.5" fill="${eye}" />
</svg>`;
}

/** The alien as a `data:` URL, ready to assign to an `Image.src`. */
export function alienDataUrl(body: string, eye: string): string {
  return `data:image/svg+xml,${encodeURIComponent(alienSvg(body, eye))}`;
}
