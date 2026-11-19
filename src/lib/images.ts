import type { ImageRef } from './types';

/** Build a resized rendition URL for known image hosts (Pexels, Unsplash, Cloudinary); other URLs pass through untouched. */
export function sizedUrl(url: string, w: number, h: number): string {
  try {
    const u = new URL(url, window.location.origin);
    if (u.hostname === 'images.pexels.com') {
      u.search = '';
      u.searchParams.set('auto', 'compress');
      u.searchParams.set('cs', 'tinysrgb');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(w));
      u.searchParams.set('h', String(h));
      return u.toString();
    }
    if (u.hostname === 'images.unsplash.com') {
      u.searchParams.set('w', String(w));
      u.searchParams.set('h', String(h));
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('q', '75');
      return u.toString();
    }
    if (u.hostname === 'res.cloudinary.com' && url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/c_fill,w_${w},h_${h},f_auto,q_auto/`);
    }
  } catch {
    /* fall through */
  }
  return url;
}

export const isResizable = (url: string) => /images\.pexels\.com|images\.unsplash\.com|res\.cloudinary\.com/.test(url);

export function ratioOf(img: Pick<ImageRef, 'width' | 'height'>, fallback = 1.6): number {
  return img.width && img.height ? img.width / img.height : fallback;
}

export function srcSetFor(url: string, ratio: number, widths: number[]): string | undefined {
  if (!isResizable(url)) return undefined;
  return widths.map((w) => `${sizedUrl(url, w, Math.round(w / ratio))} ${w}w`).join(', ');
}

/** Neutral inline placeholder used if a remote photo fails to load, so the layout never breaks. */
export const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="#cbd1ca"/><path d="M300 330l70-90 50 60 40-45 70 75z" fill="#aab3aa"/><circle cx="330" cy="200" r="22" fill="#aab3aa"/></svg>`,
  );
