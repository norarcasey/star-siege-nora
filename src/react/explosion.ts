/**
 * The burst shown when an alien is shot, inlined as an SVG so it ships with the
 * package without any bundler asset handling. The spiky star follows the
 * configurable explosion colour; a translucent white core reads as the hot
 * centre on any palette.
 */
export function explosionSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M12 1 L13.9 7.4 L19.8 4.2 L16.6 10.1 L23 12 L16.6 13.9 L19.8 19.8 L13.9 16.6 L12 23 L10.1 16.6 L4.2 19.8 L7.4 13.9 L1 12 L7.4 10.1 L4.2 4.2 L10.1 7.4 Z" fill="${color}" />
  <circle cx="12" cy="12" r="3.5" fill="#ffffff" fill-opacity="0.75" />
</svg>`;
}

/** The explosion as a `data:` URL, ready to assign to an `Image.src`. */
export function explosionDataUrl(color: string): string {
  return `data:image/svg+xml,${encodeURIComponent(explosionSvg(color))}`;
}
