import { describe, it, expect } from 'vitest';
import { shipSvg, shipDataUrl } from './ship';

describe('ship sprite', () => {
  it('embeds the hull and glow colours into the SVG', () => {
    const svg = shipSvg('#ec4899', '#3b82f6');
    expect(svg).toContain('<svg');
    expect(svg).toContain('#ec4899');
    expect(svg).toContain('#3b82f6');
  });

  it('produces a decodable svg+xml data URL', () => {
    const url = shipDataUrl('#ec4899', '#3b82f6');
    expect(url.startsWith('data:image/svg+xml,')).toBe(true);
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
    expect(decoded).toBe(shipSvg('#ec4899', '#3b82f6'));
  });
});
