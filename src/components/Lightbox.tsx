import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FALLBACK_IMAGE, ratioOf, sizedUrl } from '../lib/images';
import type { ImageRef } from '../lib/types';

interface Props {
  images: ImageRef[];
  startIndex: number;
  onClose: () => void;
}

/** Accessible modal gallery: Esc closes, ←/→ navigate, Tab is trapped, focus returns to the opener, swipe on touch. */
export function Lightbox({ images, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback(
    (delta: number) => {
      setFailed(false);
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Home') setIndex(0);
      else if (e.key === 'End') setIndex(count - 1);
      else if (e.key === 'Tab' && dialogRef.current) {
        const f = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [go, onClose, count]);

  const img = images[index];
  if (!img) return null;
  const r = ratioOf(img);
  const credit = img.attribution?.creator ? `Photo: ${img.attribution.creator}${img.attribution.source ? ` / ${img.attribution.source}` : ''}` : '';

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Project image gallery"
      ref={dialogRef}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="lightbox-bar">
        <p aria-live="polite" aria-atomic="true">
          Image {index + 1} of {count}
        </p>
        <button ref={closeRef} type="button" className="lb-btn" onClick={onClose} aria-label="Close gallery">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="lightbox-stage" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img
          key={img.url}
          src={failed ? FALLBACK_IMAGE : sizedUrl(img.url, 1600, Math.round(1600 / r))}
          alt={img.alt}
          onError={() => setFailed(true)}
        />
        {count > 1 && (
          <>
            <button type="button" className="lb-btn lb-prev" onClick={() => go(-1)} aria-label="Previous image">
              <span aria-hidden="true">‹</span>
            </button>
            <button type="button" className="lb-btn lb-next" onClick={() => go(1)} aria-label="Next image">
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}
      </div>
      <p className="lightbox-caption">
        {img.alt}
        {credit && <span className="muted"> — {credit}</span>}
      </p>
    </div>,
    document.body,
  );
}
