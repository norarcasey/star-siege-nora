import { useEffect, useState } from 'react';

/**
 * Load an image from a `src` (typically a `data:` URL) and return it once it
 * has decoded. Returns `null` until then, and reloads whenever `src` changes —
 * callers fall back to a drawn shape while it's null.
 */
export function useSprite(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);
  return image;
}
