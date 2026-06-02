import { describe, it, expect } from 'vitest';
import { alienSvg, alienDataUrl } from './alien';

describe('alien sprite', () => {
  it('embeds the body and eye colours into the SVG', () => {
    const svg = alienSvg('#22c55e', '#000000');
    expect(svg).toContain('<svg');
    expect(svg).toContain('#22c55e');
    expect(svg).toContain('#000000');
  });

  it('produces a decodable svg+xml data URL', () => {
    const url = alienDataUrl('#22c55e', '#000000');
    expect(url.startsWith('data:image/svg+xml,')).toBe(true);
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
    expect(decoded).toBe(alienSvg('#22c55e', '#000000'));
  });
});
