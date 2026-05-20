/**
 * Pick the best mix-blend-mode for a logo overlaid on a QR code.
 *
 * The user's gold standard is: dot style + multiply + opacity ~0.65.
 * So the default we PREFER is "multiply". We only fall back to "screen" or
 * "lighten" when the logo sits on a dark background (where multiply would
 * just paint a black square). "overlay" is intentionally NEVER chosen by
 * default (the user dislikes it as a default), but stays available as a
 * manual option.
 */
export type SmartBlend = "darken" | "multiply" | "screen" | "lighten" | "overlay";

export const DEFAULT_LOGO_OPACITY = 0.95;

export async function chooseBestBlend(dataUrl: string): Promise<SmartBlend> {
  try {
    const stats = await sampleLogo(dataUrl);
    const { hasDarkBg } = stats;

    // Never return screen, lighten, or overlay as default.
    // For dark-background logos, darken works better than multiply.
    if (hasDarkBg) return "darken";

    // Default = multiply (matches the user's manual recipe).
    return "multiply";
  } catch {
    return "multiply";
  }
}

async function sampleLogo(src: string) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const W = 48;
  const H = Math.max(1, Math.round((img.height / img.width) * W));
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);
  let lSum = 0,
    sSum = 0,
    n = 0,
    darkBgCount = 0,
    edgePixels = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const a = data[i + 3];
      if (a < 200) continue;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      const s = max === 0 ? 0 : (max - min) / max;
      lSum += l;
      sSum += s;
      n++;
      // sample edges (logo background)
      if (x < 2 || y < 2 || x > W - 3 || y > H - 3) {
        edgePixels++;
        if (l < 0.25) darkBgCount++;
      }
    }
  }
  const avgL = n ? lSum / n : 0.5;
  const saturation = n ? sSum / n : 0;
  const hasDarkBg = edgePixels > 0 && darkBgCount / edgePixels > 0.5;
  return { avgL, saturation, hasDarkBg };
}