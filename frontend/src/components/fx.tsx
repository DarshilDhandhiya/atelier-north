import { createElement, Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { clamp01, ease, prefersReducedMotion, useInView, useScrollProgress } from '../lib/fx';

/* ---------------------------------------------------------------- Reveal on scroll */
type Variant = 'up' | 'fade' | 'scale' | 'left';
interface RevealProps {
  as?: 'div' | 'li' | 'section' | 'p' | 'article' | 'figure' | 'dl';
  variant?: Variant;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}
/** Fades/slides content in once, when it scrolls into view. Pure CSS transitions (compositor only). */
export function Reveal({ as = 'div', variant = 'up', delay = 0, className = '', style, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref);
  return createElement(as, { ref, className: `reveal reveal--${variant} ${seen ? 'is-in' : ''} ${className}`, style: { ...style, '--d': `${delay}ms` } as CSSProperties }, children);
}

/* ---------------------------------------------------------------- Headline split into words */
export function SplitText({ text, as = 'h2', id, className = '', delay = 0 }: { text: string; as?: 'h1' | 'h2' | 'h3' | 'p'; id?: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { rootMargin: '0px 0px -5% 0px' });
  const words = text.split(' ');
  return createElement(
    as,
    { ref, id, className: `split ${seen ? 'is-in' : ''} ${className}` },
    words.map((w, i) => (
      <Fragment key={i}>
        <span className="split-word">
          <span style={{ '--i': i, '--d': `${delay}ms` } as CSSProperties}>{w}</span>
        </span>
        {i < words.length - 1 ? ' ' : ''}
      </Fragment>
    )),
  );
}

/* ---------------------------------------------------------------- Count-up number */
export function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref);
  const m = /^(\D*)(\d[\d,]*)(.*)$/.exec(value);
  const [armed, setArmed] = useState(false);
  useLayoutEffect(() => {
    if (!m || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    if (ref.current) ref.current.textContent = `${m[1]}0${m[3]}`;
    setArmed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  useEffect(() => {
    if (!m || !armed || !seen || !ref.current) return;
    const end = Number(m[2].replace(/,/g, ''));
    const el = ref.current;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = clamp01((t - t0) / duration);
      el.textContent = `${m[1]}${Math.round(end * ease(p)).toLocaleString('en-GB')}${m[3]}`;
      if (p < 1) raf = requestAnimationFrame(step);
      else el.textContent = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, seen, value]);
  return <span ref={ref}>{value}</span>;
}

/* ---------------------------------------------------------------- Marquee */
export function Marquee({ items, label }: { items: string[]; label: string }) {
  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={`${t}-${i}`}>
          {t}
          <span className="marquee-dot" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee" role="group" aria-label={label}>
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Image that grows as you scroll */
export function ExpandImage({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgress(ref, (p, el) => el.style.setProperty('--p', p.toFixed(4)));
  return (
    <div className="expand" ref={ref}>
      <div className="expand-pin">
        <div className="expand-media">{children}</div>
        {overlay && <div className="expand-overlay">{overlay}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Pinned horizontal scroller */
/** Desktop: vertical scrolling pans the row sideways. Touch / small / reduced motion: native swipe carousel. */
export function HScroll({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const dist = useRef(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (hover: hover)');
    const upd = () => setEnabled(mq.matches && !prefersReducedMotion());
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  useEffect(() => {
    const t = track.current;
    const r = row.current;
    if (!t || !r) return;
    if (!enabled) {
      t.style.height = '';
      r.style.transform = '';
      return;
    }
    const measure = () => {
      dist.current = Math.max(0, r.scrollWidth - window.innerWidth + 2 * parseFloat(getComputedStyle(r).paddingLeft));
      t.style.height = `${dist.current + window.innerHeight}px`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(r);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [enabled]);

  useScrollProgress(track, (p) => {
    if (enabled && row.current) row.current.style.transform = `translate3d(${-p * dist.current}px,0,0)`;
  });

  return (
    <div className={`hscroll ${enabled ? 'is-pinned' : ''}`} ref={track}>
      <div className="hscroll-pin">
        <div className="hscroll-row" ref={row} role="list" aria-label={label} tabIndex={enabled ? undefined : 0}>
          {children}
        </div>
      </div>
    </div>
  );
}
