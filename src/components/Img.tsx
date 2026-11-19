import { useState, type CSSProperties } from 'react';
import { FALLBACK_IMAGE, ratioOf, sizedUrl, srcSetFor } from '../lib/images';
import type { ImageRef } from '../lib/types';

interface ImgProps {
  image: ImageRef;
  /** width / height of the crop. Defaults to the stored image ratio. */
  ratio?: number;
  /** `sizes` attribute – tell the browser how wide the image is rendered. */
  sizes?: string;
  widths?: number[];
  /** Above-the-fold image: load eagerly with high priority. Everything else lazy-loads. */
  priority?: boolean;
  className?: string;
}

/** Responsive <img>: srcset for known hosts, lazy loading, explicit dimensions (no layout shift), graceful fallback. */
export function Img({ image, ratio, sizes = '100vw', widths = [480, 768, 1080, 1600], priority = false, className }: ImgProps) {
  const [failed, setFailed] = useState(false);
  const r = ratio ?? ratioOf(image);
  const base = widths[Math.min(2, widths.length - 1)];
  return (
    <img
      className={className}
      src={failed ? FALLBACK_IMAGE : sizedUrl(image.url, base, Math.round(base / r))}
      srcSet={failed ? undefined : srcSetFor(image.url, r, widths)}
      sizes={sizes}
      alt={image.alt}
      width={base}
      height={Math.round(base / r)}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
      onError={() => setFailed(true)}
    />
  );
}

/** <Img> inside a cropped frame with a stable aspect ratio and a neutral placeholder colour while loading. */
export function Frame({ image, ratio, className = '', style, ...rest }: ImgProps & { style?: CSSProperties }) {
  const r = ratio ?? ratioOf(image);
  return (
    <div className={`img-frame ${className}`} style={{ aspectRatio: String(r), ...style }}>
      <Img image={image} ratio={r} {...rest} />
    </div>
  );
}
