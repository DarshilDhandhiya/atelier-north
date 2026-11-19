import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { canRun3D, whenIdle } from '../lib/fx';
import type { HouseSceneProps } from './HouseScene';

const HouseScene = lazy(() => import('./HouseScene'));

/** Static line drawing shown while 3D loads, on weak devices, or without WebGL. */
export function HousePoster() {
  return (
    <svg className="scene-poster" viewBox="0 0 480 360" role="img" aria-label="Line drawing of a modernist house with a planted roof and timber louvres" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M40 300h400M60 300V220h250v80M120 220V150h190v70M40 150h270M60 150l20-28h210l20 28" opacity=".9" />
      <path d="M72 232v56M96 232v56M120 232v56M144 232v56M168 232v56M192 232v56M216 232v56M240 232v56M264 232v56M288 232v56" opacity=".5" />
      <path d="M330 300V120h56v180M330 120l28-16 28 16" opacity=".7" />
      <path d="M70 150c8-10 14-10 22 0M120 150c8-12 14-12 22 0M170 150c8-9 14-9 22 0" opacity=".6" />
    </svg>
  );
}

/** Lazy-loaded WebGL scene with graceful fallback. Three.js is only downloaded when it can actually run. */
export function Scene3D({ lazyLoadMargin = '400px', ...props }: HouseSceneProps & { lazyLoadMargin?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const supported = canRun3D();

  useEffect(() => {
    if (!supported || !wrap.current) return;
    const el = wrap.current;
    let cancelIdle = () => {};
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          cancelIdle = whenIdle(() => setLoad(true));
        }
      },
      { rootMargin: lazyLoadMargin },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelIdle();
    };
  }, [supported, lazyLoadMargin]);

  return (
    <div ref={wrap} className={`scene ${ready ? 'is-ready' : ''}`}>
      <HousePoster />
      {supported && load && (
        <Suspense fallback={null}>
          <HouseScene {...props} onReady={() => setReady(true)} />
        </Suspense>
      )}
    </div>
  );
}
