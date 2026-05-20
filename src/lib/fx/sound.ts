/**
 * Web Audio sound effects — synthesized at runtime, zero file size.
 * All sounds gated on user preference (defaults to enabled, persisted in localStorage).
 */
let ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
};

const enabled = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("qrforge:sfx") !== "off";
};

export const sfxOn = () => localStorage.setItem("qrforge:sfx", "on");
export const sfxOff = () => localStorage.setItem("qrforge:sfx", "off");

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.08, delay = 0) {
  if (!enabled()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function sweep(f1: number, f2: number, dur: number, gain = 0.08) {
  if (!enabled()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(f1, t0);
  osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Submit / send — short paper-plane whoosh. */
export const sfxSubmit = () => sweep(700, 1400, 0.25, 0.06);

/** Download — descending whoosh ending in a satisfying click. */
export const sfxDownload = () => {
  sweep(1200, 400, 0.35, 0.07);
  tone(880, 0.08, "triangle", 0.05, 0.32);
};

/** Save to dashboard — happy two-tone ascending. */
export const sfxSave = () => {
  tone(660, 0.12, "sine", 0.07, 0);
  tone(990, 0.18, "sine", 0.07, 0.1);
};

/** Star rating — pitch scales with star count. */
export const sfxStar = (stars: number) => {
  const base = 440 + stars * 80;
  tone(base, 0.1, "triangle", 0.06);
  if (stars >= 4) tone(base * 1.5, 0.12, "triangle", 0.06, 0.08);
  if (stars === 5) {
    // Cheer flourish
    [0, 0.08, 0.16, 0.24].forEach((d, i) => tone(880 + i * 120, 0.12, "sine", 0.07, d));
  }
};
