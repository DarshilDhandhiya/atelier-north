import { useEffect, useRef } from 'react';
import {
  BoxGeometry,
  DirectionalLight,
  EdgesGeometry,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  GridHelper,
  BufferGeometry,
} from 'three';
import { clamp01, ease, hasFinePointer, lerp, prefersReducedMotion, trackProgress } from '../lib/fx';

export interface HouseSceneProps {
  /** hero: idles + follows the pointer. explode: driven by scroll through `trackRef`. */
  mode: 'hero' | 'explode';
  trackRef?: React.RefObject<HTMLElement | null>;
  onStep?: (step: number) => void;
  onReady?: () => void;
}

const STEPS = 4;
type Part = { group: Group; base: Vector3; explode: Vector3; edges: LineBasicMaterial[]; step: number };

/** Procedural modernist house: no model file to download, a few dozen meshes, no shadows. */
export default function HouseScene({ mode, trackRef, onStep, onReady }: HouseSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const cbs = useRef({ onStep, onReady });
  cbs.current = { onStep, onReady };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const fine = hasFinePointer();
    const small = window.innerWidth < 768;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: !small, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 60);

    /* ---------- lighting (cheap: no shadows) ---------- */
    scene.add(new HemisphereLight(0xdfeeee, 0x16201f, 1.35));
    const sun = new DirectionalLight(0xfff1dc, 2.1);
    sun.position.set(6, 9, 5);
    scene.add(sun);
    const rim = new DirectionalLight(0x7fd1cc, 0.9);
    rim.position.set(-7, 3, -6);
    scene.add(rim);

    /* ---------- materials / geometry ---------- */
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(o: T) => (disposables.push(o), o);
    const mat = (color: number, extra: Partial<MeshStandardMaterial> = {}) => track(new MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.02, ...extra }));
    const stone = mat(0xe3e8e1);
    const concrete = mat(0x9ba59d, { roughness: 0.95 });
    const timber = mat(0xb88a5a, { roughness: 0.7 });
    const glass = mat(0x9fd8dc, { transparent: true, opacity: 0.22, roughness: 0.08, metalness: 0.2, depthWrite: false });
    const green = mat(0x3f7a52, { roughness: 1 });
    const fjord = mat(0x25565c);
    const birch = mat(0xd9cbb0);
    const box = (w: number, h: number, d: number) => track(new BoxGeometry(w, h, d));

    const parts: Part[] = [];
    const makePart = (step: number, explode: [number, number, number], base: [number, number, number] = [0, 0, 0]): Part => {
      const group = new Group();
      group.position.set(...base);
      scene.add(group);
      const p: Part = { group, base: new Vector3(...base), explode: new Vector3(...explode), edges: [], step };
      parts.push(p);
      return p;
    };
    /** Adds a mesh plus crisp architectural edge lines. */
    const add = (p: Part, geo: BufferGeometry, m: Material, x: number, y: number, z: number, edges = true) => {
      const mesh = new Mesh(geo, m);
      mesh.position.set(x, y, z);
      p.group.add(mesh);
      if (edges) {
        const lm = track(new LineBasicMaterial({ color: 0xbfe9e5, transparent: true, opacity: 0.5 }));
        p.edges.push(lm);
        const eg = track(new EdgesGeometry(geo, 20));
        const ls = new LineSegments(eg, lm);
        ls.position.copy(mesh.position);
        p.group.add(ls);
      }
      return mesh;
    };

    // 0 — site: slab + faint survey grid
    const site = makePart(0, [0, -1.0, 0]);
    add(site, box(6.6, 0.16, 4.2), concrete, 0, -0.08, 0);
    const grid = new GridHelper(16, 32, 0x2a4a4d, 0x1b3234);
    (grid.material as Material).transparent = true;
    (grid.material as Material).opacity = 0.55;
    grid.position.y = -0.17;
    scene.add(grid);
    track(grid.geometry);
    track(grid.material as Material);

    // 1 — structure: ground floor, upper floor, core
    const ground = makePart(1, [0, 0.2, 0], [0, 0.78, 0]);
    add(ground, box(4.6, 0.1, 2.5), stone, 0, -0.62, 0);
    add(ground, box(4.5, 1.15, 0.14), stone, 0, 0, -1.18);
    add(ground, box(0.3, 1.15, 2.5), concrete, -2.15, 0, 0);
    add(ground, box(0.3, 1.15, 2.5), concrete, 2.15, 0, 0);
    // furniture seen through the glass
    add(ground, box(1.2, 0.28, 0.55), fjord, -0.6, -0.42, -0.3, false);
    add(ground, box(0.7, 0.18, 0.5), birch, 0.9, -0.48, 0.1, false);
    add(ground, box(0.9, 0.04, 0.9), mat(0xc9bba0), 0.1, -0.55, 0.1, false);

    const upper = makePart(1, [0.2, 1.25, 0], [0.7, 2.0, 0.05]);
    add(upper, box(2.9, 1.05, 2.05), timber, 0, 0, 0);
    add(upper, box(2.2, 0.62, 0.05), glass, 0, 0.05, 1.05, true);

    const core = makePart(1, [-0.5, 0.9, -0.4], [-1.55, 1.45, -0.55]);
    add(core, box(0.75, 2.9, 0.75), concrete, 0, 0, 0);

    // 2 — envelope: glass + timber louvres
    const env = makePart(2, [0, 0.2, 1.0], [0, 0.78, 0]);
    add(env, box(3.95, 1.15, 0.04), glass, 0, 0, 1.12, true);
    const louvreCount = small ? 12 : 20;
    const louvres = track(new InstancedMesh(box(0.06, 1.2, 0.16), timber, louvreCount));
    const m4 = new Matrix4();
    const louvrePos: number[] = [];
    for (let i = 0; i < louvreCount; i++) louvrePos.push(-1.9 + (3.8 * i) / (louvreCount - 1));
    const placeLouvres = (spread: number) => {
      for (let i = 0; i < louvreCount; i++) {
        m4.makeTranslation(louvrePos[i] * spread, 0, 1.38);
        louvres.setMatrixAt(i, m4);
      }
      louvres.instanceMatrix.needsUpdate = true;
    };
    placeLouvres(1);
    env.group.add(louvres);

    // 3 — roof + planted roof
    const roof = makePart(3, [0, 2.4, 0], [0, 3.05, 0]);
    add(roof, box(5.2, 0.14, 3.0), stone, 0, 0, 0);
    const plantCount = small ? 26 : 46;
    const plants = track(new InstancedMesh(box(0.22, 0.1, 0.22), green, plantCount));
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < plantCount; i++) {
      const h = 0.6 + rnd() * 1.6;
      m4.makeScale(1, h, 1).setPosition(-2.3 + rnd() * 4.6, 0.07 + 0.05 * h, -1.3 + rnd() * 2.6);
      plants.setMatrixAt(i, m4);
    }
    roof.group.add(plants);

    /* ---------- state ---------- */
    const target = { yaw: 0.65, pitch: 0.3, dist: 13.5 };
    const cur = { yaw: 0.65, pitch: 0.3, dist: 13.5, exp: 0, ty: 1.5 };
    let pointerX = 0;
    let pointerY = 0;
    let progress = 0;
    let step = -1;
    let expT = 0;
    let visible = false;
    let raf = 0;
    let last = 0;
    let idleTime = 0;
    const tmp = new Vector3();

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 0.85 ? 42 : 32;
      camera.updateProjectionMatrix();
    };

    const setTargets = () => {
      if (mode === 'explode' && trackRef?.current) progress = trackProgress(trackRef.current);
      if (mode === 'explode') {
        const e = ease(clamp01((progress - 0.08) / 0.7));
        target.dist = lerp(13.5, 17.5, e);
        target.yaw = lerp(0.85, -0.7, ease(progress));
        target.pitch = lerp(0.28, 0.42, e);
        expT = e;
        const s = Math.min(STEPS - 1, Math.floor(progress * STEPS));
        if (s !== step) {
          step = s;
          cbs.current.onStep?.(s);
        }
      } else {
        target.yaw = 0.65 + pointerX * 0.45 + (reduced ? 0 : idleTime * 0.12);
        target.pitch = 0.3 - pointerY * 0.12;
      }
    };

    /** Returns true while values are still converging (keeps the loop alive). */
    const update = (dt: number) => {
      const k = reduced ? 1 : 1 - Math.pow(0.0015, dt); // frame-rate independent damping
      setTargets();
      cur.yaw = lerp(cur.yaw, target.yaw, k);
      cur.pitch = lerp(cur.pitch, target.pitch, k);
      cur.dist = lerp(cur.dist, target.dist, k);
      cur.exp = lerp(cur.exp, expT, k);
      cur.ty = lerp(cur.ty, 1.5 + cur.exp * 1.0, k);

      for (const p of parts) {
        p.group.position.set(p.base.x + p.explode.x * cur.exp, p.base.y + p.explode.y * cur.exp, p.base.z + p.explode.z * cur.exp);
        // dim everything except the step being explained (explode mode only)
        const active = mode === 'explode' ? (step === p.step ? 0.95 : 0.22) : 0.5;
        for (const lm of p.edges) lm.opacity = lerp(lm.opacity, active, k);
      }
      placeLouvres(1 + cur.exp * 0.18);

      camera.position.set(Math.sin(cur.yaw) * Math.cos(cur.pitch) * cur.dist, Math.sin(cur.pitch) * cur.dist + cur.ty, Math.cos(cur.yaw) * Math.cos(cur.pitch) * cur.dist);
      camera.lookAt(tmp.set(0, cur.ty, 0));

      const settled = Math.abs(cur.yaw - target.yaw) + Math.abs(cur.pitch - target.pitch) + Math.abs(cur.dist - target.dist) + Math.abs(cur.exp - expT) < 0.0008;
      return !settled;
    };

    let first = true;
    const frame = (t: number) => {
      raf = 0;
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      if (mode === 'hero' && !reduced) idleTime += dt;
      const moving = update(dt);
      renderer.render(scene, camera);
      if (first) {
        first = false;
        cbs.current.onReady?.();
      }
      // hero idles continuously while visible; explode mode sleeps when nothing changes
      if (visible && ((mode === 'hero' && !reduced) || moving)) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    /* ---------- wiring ---------- */
    const ro = new ResizeObserver(() => {
      resize();
      wake();
    });
    ro.observe(el);
    resize();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(el);

    const onScroll = () => wake();
    if (mode === 'explode') window.addEventListener('scroll', onScroll, { passive: true });

    const onPointer = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
      wake();
    };
    if (mode === 'hero' && fine && !reduced) window.addEventListener('pointermove', onPointer, { passive: true });

    const onVis = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else wake();
    };
    document.addEventListener('visibilitychange', onVis);

    // lose-context safety: if the GPU resets, stop quietly instead of throwing
    const onLost = (e: Event) => e.preventDefault();
    renderer.domElement.addEventListener('webglcontextlost', onLost);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode, trackRef]);

  return <div ref={host} className="scene-host" />;
}
