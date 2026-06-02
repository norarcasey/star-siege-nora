/**
 * The player ship, inlined as an SVG so it ships with the package without any
 * bundler asset handling. The hull tint follows the configurable shooter
 * colour; wings derive from it and the engine glow matches the laser palette.
 */
export function shipSvg(hull: string, glow: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M9 19 L12 22 L15 19 Z" fill="${glow}" />
  <path d="M12 1 L16 13 L12 11 L8 13 Z" fill="${hull}" />
  <path d="M8 13 L2 18 L4 12 Z" fill="${hull}" fill-opacity="0.7" />
  <path d="M16 13 L22 18 L20 12 Z" fill="${hull}" fill-opacity="0.7" />
  <circle cx="12" cy="8" r="1.6" fill="#fbcfe8" />
</svg>`;
}

/** The ship as a `data:` URL, ready to assign to an `Image.src`. */
export function shipDataUrl(hull: string, glow: string): string {
  return `data:image/svg+xml,${encodeURIComponent(shipSvg(hull, glow))}`;
}
