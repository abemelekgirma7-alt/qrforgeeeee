/**
 * Lightweight "fly to" animation helpers. Spawns a transient DOM node that
 * animates from a source element/point to a target, then self-removes.
 * Pure DOM + Web Animations API — no React state, no re-renders.
 */
type Pt = { x: number; y: number };

const rectCenter = (r: DOMRect): Pt => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

function spawn(node: HTMLElement, from: Pt, to: Pt, dur = 900, rotate = true) {
  if (typeof window === "undefined") return;
  document.body.appendChild(node);
  Object.assign(node.style, {
    position: "fixed",
    left: `${from.x}px`,
    top: `${from.y}px`,
    transform: "translate(-50%, -50%)",
    zIndex: "9999",
    pointerEvents: "none",
  } as CSSStyleDeclaration);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mid = `translate(${dx * 0.5 - 30}px, ${dy * 0.3 - 60}px) scale(1.05) rotate(${rotate ? -8 : 0}deg)`;
  const end = `translate(${dx}px, ${dy}px) scale(0.3) rotate(${rotate ? 20 : 0}deg)`;
  const anim = node.animate(
    [
      { transform: "translate(-50%, -50%) scale(0.4) rotate(0)", opacity: 0 },
      { transform: `translate(-50%, -50%) scale(1) rotate(0)`, opacity: 1, offset: 0.15 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.3 - 60}px)) scale(1.05) rotate(${rotate ? -8 : 0}deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3) rotate(${rotate ? 20 : 0}deg)`, opacity: 0 },
    ],
    { duration: dur, easing: "cubic-bezier(.5,.05,.3,1)", fill: "forwards" },
  );
  anim.onfinish = () => node.remove();
}

const getTargetPt = (selectors: string[]): Pt => {
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el) return rectCenter(el.getBoundingClientRect());
  }
  // Default: top-right of viewport (browser downloads bar area)
  return { x: window.innerWidth - 40, y: 40 };
};

function makePaperPlane(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:hsl(var(--primary));filter:drop-shadow(0 6px 14px hsl(var(--primary)/.5))"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg>`;
  return el;
}

function makeQrIcon(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:hsl(var(--primary));filter:drop-shadow(0 8px 18px hsl(var(--primary)/.55))"><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h2v3h-2zM18 18h2v2h-2z"/></svg>`;
  return el;
}

function makeStar(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="hsl(45 100% 55%)" stroke="hsl(45 100% 45%)" stroke-width="1.5" style="filter:drop-shadow(0 4px 10px hsl(45 100% 55% / .6))"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>`;
  return el;
}

const fromEl = (src: HTMLElement | Pt | null | undefined): Pt => {
  if (!src) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  if ("x" in src) return src;
  return rectCenter(src.getBoundingClientRect());
};

/** Paper plane: from a button → flies off to top-right (or matched selectors). */
export function flyPaperPlane(src?: HTMLElement | null) {
  spawn(makePaperPlane(), fromEl(src), getTargetPt(['[data-fly-target="contact"]']), 950);
}

/** QR icon flies to the browser downloads area (top-right of viewport). */
export function flyQrToDownloads(src?: HTMLElement | null) {
  // Multiple small QRs for a "burst" feel
  const start = fromEl(src);
  const target = { x: window.innerWidth - 40, y: 40 };
  spawn(makeQrIcon(), start, target, 1000, false);
  setTimeout(() => spawn(makeQrIcon(), { x: start.x - 20, y: start.y + 10 }, target, 1100, false), 80);
}

/** Save flies to the dashboard link in the navbar. */
export function flyToDashboard(src?: HTMLElement | null) {
  const target = getTargetPt(['a[href="/dashboard"]', '[data-fly-target="dashboard"]']);
  spawn(makeQrIcon(), fromEl(src), target, 950, false);
}

/** Star burst — small stars fly upward briefly. */
export function flyStars(src: HTMLElement | null | undefined, count: number) {
  const start = fromEl(src);
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const target = { x: start.x + (Math.random() - 0.5) * 240, y: start.y - 160 - Math.random() * 80 };
      spawn(makeStar(), start, target, 1100, true);
    }, i * 70);
  }
}
