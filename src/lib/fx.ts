import { useEffect, useRef, useState, type RefObject } from 'react';

/* ------------------------------------------------------------------ capability checks */
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export const hasFinePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

let webglOk: boolean | null = null;
/** True when it is sensible to run WebGL: supported, not data-saver, not a very weak device. */
export function canRun3D(): boolean {
  if (typeof window === 'undefined') return false;
  if (webglOk !== null) return webglOk;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return (webglOk = false);
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return (webglOk = false);
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) return (webglOk = false);
  try {
    const c = document.createElement('canvas');
    webglOk = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webglOk = false;
  }
  return webglOk;
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Run `fn` when the browser is idle (falls back to a short timeout). */
export const whenIdle = (fn: () => void, timeout = 1200) => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
};

/* ------------------------------------------------------------------ in-view */
/** Becomes true when the element enters the viewport. `once` keeps it true afterwards. */
export function useInView<T extends Element>(ref: RefObject<T | null>, { once = true, rootMargin = '0px 0px -8% 0px', threshold = 0 } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) setInView(false);
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, rootMargin, threshold]);
  return inView;
}

/* ------------------------------------------------------------------ scroll progress */
/** 0 → 1 while a tall "track" element scrolls past (its sticky child stays pinned). */
export function trackProgress(track: HTMLElement): number {
  const r = track.getBoundingClientRect();
  const total = r.height - window.innerHeight;
  return total <= 0 ? 0 : clamp01(-r.top / total);
}
/** 0 → 1 as an element travels from entering the bottom to leaving the top of the viewport. */
export function passProgress(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  return clamp01((window.innerHeight - r.top) / (window.innerHeight + r.height));
}

/**
 * Calls `onProgress` (rAF-throttled) only while `ref` is near the viewport.
 * No React state: callers write CSS variables / refs directly so scrolling never re-renders.
 */
export function useScrollProgress<T extends HTMLElement>(ref: RefObject<T | null>, onProgress: (p: number, el: T) => void, mode: 'track' | 'pass' = 'track') {
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let active = typeof IntersectionObserver === 'undefined';
    let raf = 0;
    const run = () => {
      raf = 0;
      cb.current(mode === 'track' ? trackProgress(el) : passProgress(el), el);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    const attach = () => {
      if (active) return;
      active = true;
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      onScroll();
    };
    const detach = () => {
      active = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? attach() : detach()), { rootMargin: '20% 0px 20% 0px' });
      io.observe(el);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    run();
    return () => {
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, mode]);
}

/* ------------------------------------------------------------------ pointer tilt (3D card hover) */
/** Adds a perspective tilt + moving highlight to an element on fine pointers. Zero React re-renders. */
export function useTilt<T extends HTMLElement>(ref: RefObject<T | null>, max = 7) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = (e.clientX - r.left) / r.width;
      y = (e.clientY - r.top) / r.height;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const enter = () => el.classList.add('is-tilting');
    const leave = () => {
      el.classList.remove('is-tilting');
      x = y = 0.5;
      apply();
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, max]);
}

/* ------------------------------------------------------------------ global effects (one scroll listener) */
/** Sets html.js, a scroll progress bar variable, header state and magnetic buttons. Call once. */
export function initGlobalFx() {
  const root = document.documentElement;
  root.classList.add('js');
  let lastY = window.scrollY;
  let raf = 0;
  const tick = () => {
    raf = 0;
    const y = window.scrollY;
    const max = Math.max(1, root.scrollHeight - window.innerHeight);
    root.style.setProperty('--scroll', String(clamp01(y / max)));
    root.dataset.scrolled = y > 40 ? 'true' : 'false';
    const down = y > lastY + 4;
    const up = y < lastY - 4;
    if (y < 200 || up) root.dataset.header = 'show';
    else if (down) root.dataset.header = 'hide';
    lastY = y;
  };
  window.addEventListener('scroll', () => !raf && (raf = requestAnimationFrame(tick)), { passive: true });
  tick();

  if (hasFinePointer() && !prefersReducedMotion()) {
    let target: HTMLElement | null = null;
    let mraf = 0;
    let mx = 0;
    let my = 0;
    const applyMag = () => {
      mraf = 0;
      if (!target) return;
      const r = target.getBoundingClientRect();
      const dx = (mx - (r.left + r.width / 2)) / r.width;
      const dy = (my - (r.top + r.height / 2)) / r.height;
      target.style.transform = `translate3d(${dx * 10}px, ${dy * 8}px, 0)`;
    };
    document.addEventListener(
      'pointermove',
      (e) => {
        const b = (e.target as Element | null)?.closest?.('[data-magnetic]') as HTMLElement | null;
        if (target && b !== target) {
          target.style.transform = '';
          target = null;
        }
        if (b) {
          target = b;
          mx = e.clientX;
          my = e.clientY;
          if (!mraf) mraf = requestAnimationFrame(applyMag);
        }
      },
      { passive: true },
    );
  }
}
