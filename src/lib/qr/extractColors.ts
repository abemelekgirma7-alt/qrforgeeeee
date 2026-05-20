/**
 * Extract a "brand palette" from a logo image:
 *   - primary: the dominant, saturated color (used for QR dots + finder ring)
 *   - secondary: a contrasting darker/lighter accent (used for finder inner dot)
 *
 * Strategy: downsample the image to ~64px, bucket pixels into a 6x6x6
 * RGB cube, ignore near-white / near-transparent pixels, then rank buckets
 * by (count * saturation). The top bucket is primary. The secondary is the
 * highest-ranked bucket whose hue is reasonably distinct from the primary
 * (or, failing that, a darkened version of the primary).
 */
export type LogoPalette = { primary: string; secondary: string };

export async function extractLogoPalette(dataUrl: string): Promise<LogoPalette> {
  const img = await loadImg(dataUrl);
  const W = 64;
  const H = Math.max(1, Math.round((img.height / img.width) * W));
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  const buckets = new Map<number, { r: number; g: number; b: number; n: number; sat: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 200) continue;
    // skip near-white and near-black (they rarely reflect brand color)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 240 && min > 220) continue; // near-white
    if (max < 25) continue; // near-black

    const sat = max === 0 ? 0 : (max - min) / max;
    // bucket each channel into 6 bins
    const br = Math.floor(r / 43);
    const bg = Math.floor(g / 43);
    const bb = Math.floor(b / 43);
    const key = (br << 12) | (bg << 6) | bb;
    const cur = buckets.get(key);
    if (cur) {
      cur.r += r; cur.g += g; cur.b += b; cur.n += 1; cur.sat += sat;
    } else {
      buckets.set(key, { r, g, b, n: 1, sat });
    }
  }

  if (buckets.size === 0) {
    return { primary: "#0f172a", secondary: "#0f172a" };
  }

  const ranked = [...buckets.values()]
    .map((b) => ({
      r: Math.round(b.r / b.n),
      g: Math.round(b.g / b.n),
      b: Math.round(b.b / b.n),
      score: b.n * (0.4 + b.sat / b.n), // weight count + average saturation
    }))
    .sort((a, b) => b.score - a.score);

  const primary = ranked[0];
  // pick a secondary distinct in hue (>= 60° away) or fall back to a darkened primary
  const primaryHue = rgbToHue(primary.r, primary.g, primary.b);
  const secondary =
    ranked.slice(1, 12).find((c) => {
      const h = rgbToHue(c.r, c.g, c.b);
      return Math.min(Math.abs(h - primaryHue), 360 - Math.abs(h - primaryHue)) > 50;
    }) ?? darken(primary, 0.45);

  return {
    primary: rgbToHex(primary.r, primary.g, primary.b),
    secondary: rgbToHex(secondary.r, secondary.g, secondary.b),
  };
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function rgbToHex(r: number, g: number, b: number) {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function darken(c: { r: number; g: number; b: number }, amt: number) {
  return {
    r: Math.round(c.r * (1 - amt)),
    g: Math.round(c.g * (1 - amt)),
    b: Math.round(c.b * (1 - amt)),
  };
}
