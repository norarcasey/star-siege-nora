import { describe, it, expect } from 'vitest';
import { explosionSvg, explosionDataUrl } from './explosion';

describe('explosion sprite', () => {
  it('embeds the explosion colour into the SVG', () => {
    const svg = explosionSvg('#f97316');
    expect(svg).toContain('<svg');
    expect(svg).toContain('#f97316');
  });

  it('produces a decodable svg+xml data URL', () => {
    const url = explosionDataUrl('#f97316');
    expect(url.startsWith('data:image/svg+xml,')).toBe(true);
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
    expect(decoded).toBe(explosionSvg('#f97316'));
  });
});
