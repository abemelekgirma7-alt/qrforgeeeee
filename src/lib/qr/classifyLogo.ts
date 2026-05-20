/**
 * Classify an uploaded logo and return smart embedding defaults.
 *
 * Replaces the old "fixed 95% opacity / 95% scale" approach. Defaults are
 * derived from what the logo actually IS:
 *   - square     → square logo on transparent or white bg (e.g. Spotify tile)
 *   - circle     → circular logo / circular alpha mask (e.g. Instagram avatar)
 *   - face       → photographic / face crop (skin tones, low saturation, high detail)
 *   - fullbleed  → full-canvas brand mark with mostly opaque colored area
 *
 * Strict 1:1 mode: if the source pixel dimensions are already perfectly
 * square AND it has a transparent background, we mark `strict1to1 = true`
 * so the upload pipeline skips center-crop / resize.
 */
export type LogoKind = "square" | "circle" | "face" | "fullbleed";
export type LogoBlend = "darken" | "multiply" | "screen" | "lighten" | "overlay" | "none";

export type LogoClassification = {
  kind: LogoKind;
  scale: number;       // recommended logoScale (0.5 - 1.1)
  opacity: number;     // recommended logoOpacity (0.7 - 1.0)
  blend: LogoBlend;    // recommended blend mode
  strict1to1: boolean; // if true, do not crop/resize the source image
  edgeTouch: boolean;  // if true, scale so logo edges meet QR modules
  width: number;
  height: number;
};

export async function classifyLogo(dataUrl: string): Promise<LogoClassification> {
  const img = await loadImage(dataUrl);
  const W = 64;
  const H = Math.max(1, Math.round((img.height / img.width) * W));
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  let opaque = 0;
  let edgeOpaque = 0;
  let edgeTotal = 0;
  let cornerOpaque = 0;
  let darkBg = 0;
  let darkBgTotal = 0;
  let skinPixels = 0;
  let satSum = 0;
  let satCount = 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      const isEdge = x < 2 || y < 2 || x > W - 3 || y > H - 3;
      const isCorner =
        (x < 3 && y < 3) ||
        (x > W - 4 && y < 3) ||
        (x < 3 && y > H - 4) ||
        (x > W - 4 && y > H - 4);
      if (isEdge) edgeTotal++;
      if (a > 200) {
        opaque++;
        if (isEdge) edgeOpaque++;
        if (isCorner) cornerOpaque++;
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        const lum = (max + min) / 2;
        const sat = max === 0 ? 0 : (max - min) / max;
        satSum += sat;
        satCount++;
        if (isEdge) {
          darkBgTotal++;
          if (lum < 0.25) darkBg++;
        }
        // crude skin-tone test → suggests photo / face
        if (
          r > 95 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15 &&
          sat > 0.15 && sat < 0.7
        ) skinPixels++;
      }
    }
  }

  const opaqueRatio = opaque / (W * H);
  const edgeOpaqueRatio = edgeTotal ? edgeOpaque / edgeTotal : 0;
  const cornerOpaqueRatio = cornerOpaque / 12;
  const skinRatio = opaque ? skinPixels / opaque : 0;
  const avgSat = satCount ? satSum / satCount : 0;
  const hasDarkBg = darkBgTotal ? darkBg / darkBgTotal > 0.5 : false;
  const isSquareSource = Math.abs(img.width - img.height) <= 2;
  const hasTransparentBg = edgeOpaqueRatio < 0.3 && cornerOpaqueRatio < 0.5;

  // Strict 1:1: source already perfectly square + transparent background
  // → preserve every pixel, don't crop or resize.
  const strict1to1 = isSquareSource && hasTransparentBg;

  let kind: LogoKind;
  if (skinRatio > 0.12 && avgSat < 0.55) {
    kind = "face";
  } else if (cornerOpaqueRatio < 0.25 && hasTransparentBg) {
    // circular / irregular alpha mask
    kind = "circle";
  } else if (opaqueRatio > 0.75) {
    kind = "fullbleed";
  } else {
    kind = "square";
  }

  // Per-kind embedding presets (replaces the old 0.95 / 0.95 / multiply default)
  let scale = 0.85;
  let opacity = 1.0;
  let blend: LogoBlend = "none";
  let edgeTouch = false;

  switch (kind) {
    case "square":
      // Square brand tile (Spotify, Nike). Touch the modules edge-to-edge.
      scale = 0.85;
      opacity = 1.0;
      blend = "none";
      edgeTouch = true;
      break;
    case "circle":
      // Circular avatar / mark (Instagram). Slightly smaller, no blend.
      scale = 0.8;
      opacity = 1.0;
      blend = "none";
      edgeTouch = true;
      break;
    case "face":
      // Photographic content — multiply with reduced opacity so QR modules
      // remain visible through skin/photo detail.
      scale = 0.78;
      opacity = 0.9;
      blend = "multiply";
      edgeTouch = false;
      break;
    case "fullbleed":
      // Full-canvas mark — Inkscape-style overlay.
      scale = 1.0;
      opacity = 0.95;
      blend = hasDarkBg ? "darken" : "multiply";
      edgeTouch = true;
      break;
  }

  return {
    kind,
    scale,
    opacity,
    blend,
    strict1to1,
    edgeTouch,
    width: img.width,
    height: img.height,
  };
}

/**
 * Adaptive scale: when the QR's module density (version) changes because the
 * payload got bigger or the error correction got higher, re-anchor the logo
 * scale so it still touches the modules with no gap.
 *
 * `payloadLength` is the rendered string length, `ec` is the error-correction
 * level. Larger payloads → smaller modules → logo should NOT grow. We return
 * a small multiplicative correction in [0.85, 1.05].
 */
export function adaptiveScaleFor(
  baseScale: number,
  payloadLength: number,
  ec: "L" | "M" | "Q" | "H",
): number {
  const ecBonus = ec === "H" ? 0.04 : ec === "Q" ? 0.02 : ec === "M" ? 0 : -0.02;
  // density curve: short URL ≈ 1.0, vCard ≈ 0.92, very long ≈ 0.86
  const density =
    payloadLength < 60 ? 1.0 :
    payloadLength < 150 ? 0.97 :
    payloadLength < 350 ? 0.93 :
    0.88;
  const out = baseScale * density + ecBonus;
  return Math.max(0.5, Math.min(1.1, out));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}