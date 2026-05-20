import QRCode from "qrcode";
import type { QrStyle } from "./style";

/**
 * Premium "scan card" SVG builder.
 *
 * One look, used by every preview AND every download (so WYSIWYG):
 *   - Clean white panel (uses style.bg)
 *   - Perfectly round QR dots (single dominant color = style.fg)
 *   - 3 large rounded-square Instagram-style finder eyes with a solid
 *     circular dot inside
 *   - 4 minimal bullseye target markers in the panel's outer corners
 *   - "[ SCAN ME ]" caption below, wide letter-spacing, bracket flanks
 *   - Optional circular logo in the dead-center, with white padding and a
 *     module-safe exclusion zone so dots never bleed into the logo
 *
 * Output: a self-contained SVG string. The same string is what we render
 * in React (via dangerouslySetInnerHTML) and what we rasterize to PNG/JPEG/
 * WebP for downloads — guaranteeing the file matches the preview exactly.
 */

export type PremiumQrOptions = {
  /** Render the SCAN ME caption + corner targets. Default true. */
  frame?: boolean;
  /** Caption text. Default "SCAN ME". */
  caption?: string;
};

type Matrix = { size: number; get: (r: number, c: number) => boolean };

function buildMatrix(value: string, ec: QrStyle["errorCorrection"]): Matrix {
  const qr = QRCode.create(value || " ", { errorCorrectionLevel: ec });
  const size = qr.modules.size;
  const data: boolean[] = new Array(size * size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) data[r * size + c] = Boolean(qr.modules.get(r, c));
  }
  return {
    size,
    get: (r, c) => (r < 0 || c < 0 || r >= size || c >= size ? false : data[r * size + c]),
  };
}

function isInEye(r: number, c: number, size: number): boolean {
  return (
    (r < 7 && c < 7) ||
    (r < 7 && c >= size - 7) ||
    (r >= size - 7 && c < 7)
  );
}

function isInLogoZone(
  r: number,
  c: number,
  size: number,
  logoFraction: number,
  paddingModules: number,
): boolean {
  if (logoFraction <= 0) return false;
  const center = (size - 1) / 2;
  const radius = (size * logoFraction) / 2 + paddingModules;
  const dr = r - center;
  const dc = c - center;
  return Math.sqrt(dr * dr + dc * dc) <= radius;
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&apos;",
  );
}

export type PremiumSvg = { svg: string; width: number; height: number };

export function buildPremiumQrSvg(
  data: string,
  style: QrStyle,
  opts: PremiumQrOptions = {},
): PremiumSvg {
  const frame = opts.frame === true;
  const caption = opts.caption ?? "SCAN ME";

  const matrix = buildMatrix(data, style.errorCorrection);
  // Quiet-zone margin (modules) — required for scanability
  const quiet = 4;
  const qrInner = matrix.size + quiet * 2;
  // Outer card padding (modules) — gives the corner targets breathing room
  const outerPad = frame ? 3 : 0;
  const captionH = frame ? 8 : 0;
  const W = qrInner + outerPad * 2;
  const H = qrInner + outerPad * 2 + captionH;
  const qrX0 = outerPad;
  const qrY0 = outerPad;

  const fg = style.fg || "#000000";
  const bg = style.bg || "#ffffff";
  const eyeColor = style.cornerSquareColor || fg;
  const eyeDotColor = style.cornerDotColor || fg;

  // ─ Dots ─────────────────────────────────────────────
  const hasLogo = Boolean(style.logoDataUrl);
  const logoFraction = hasLogo ? Math.min(0.28, Math.max(0.12, style.logoSize)) : 0;
  const logoPadModules = Math.max(1.5, (style.logoMargin || 6) / 4);

  const dotPaths: string[] = [];
  const dotR = 0.42; // perfectly round dots
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.get(row, col)) continue;
      if (isInEye(row, col, matrix.size)) continue;
      if (hasLogo && isInLogoZone(row, col, matrix.size, logoFraction, logoPadModules)) continue;
      const cx = qrX0 + quiet + col + 0.5;
      const cy = qrY0 + quiet + row + 0.5;
      dotPaths.push(
        `M${cx - dotR} ${cy}a${dotR} ${dotR} 0 1 0 ${2 * dotR} 0a${dotR} ${dotR} 0 1 0 ${-2 * dotR} 0`,
      );
    }
  }

  // ─ Finder eyes (Instagram-style rounded squares + solid inner circle) ─
  const eyePositions: Array<[number, number]> = [
    [qrX0 + quiet, qrY0 + quiet],
    [qrX0 + quiet + matrix.size - 7, qrY0 + quiet],
    [qrX0 + quiet, qrY0 + quiet + matrix.size - 7],
  ];
  const outerRx = 2;
  const middleRx = 1.4;
  const innerR = 1.5; // radius of solid inner circle (in modules)
  const eyes = eyePositions
    .map(([x, y]) => {
      const cx = x + 3.5;
      const cy = y + 3.5;
      return [
        `<rect x="${x}" y="${y}" width="7" height="7" rx="${outerRx}" ry="${outerRx}" fill="${eyeColor}"/>`,
        `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="${middleRx}" ry="${middleRx}" fill="${bg}"/>`,
        `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="${eyeDotColor}"/>`,
      ].join("");
    })
    .join("");

  // ─ 4 outer corner targets (minimal concentric bullseye) ─
  let targets = "";
  if (frame) {
    const t = 1.2; // inset from card edge
    const ringR = 1.4;
    const ringStroke = 0.45;
    const dotR2 = 0.6;
    const points: Array<[number, number]> = [
      [t + ringR, t + ringR],
      [W - t - ringR, t + ringR],
      [t + ringR, H - captionH - t - ringR],
      [W - t - ringR, H - captionH - t - ringR],
    ];
    targets = points
      .map(
        ([cx, cy]) =>
          `<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${eyeColor}" stroke-width="${ringStroke}"/>` +
          `<circle cx="${cx}" cy="${cy}" r="${dotR2}" fill="${eyeColor}"/>`,
      )
      .join("");
  }

  // ─ "[ SCAN ME ]" caption ─
  let captionSvg = "";
  if (frame) {
    const cy = qrY0 + qrInner + outerPad + captionH / 2 + 0.4;
    const fontSize = 3.2;
    const tracking = 1.0; // wide spacing
    const bracketGap = 6.0;
    const text = caption;
    // Approximate text width (modules): 0.55em per char + tracking
    const approxCharW = fontSize * 0.6;
    const textW = text.length * approxCharW + tracking * (text.length - 1);
    const cxMid = W / 2;
    const textX = cxMid;
    const bracketX1 = cxMid - textW / 2 - bracketGap;
    const bracketX2 = cxMid + textW / 2 + bracketGap;
    const bArmW = 0.5; // bracket stroke width
    const bArmLen = 1.6;
    const bH = 4.4; // bracket vertical height
    captionSvg = [
      // Left bracket
      `<rect x="${bracketX1}" y="${cy - bH / 2}" width="${bArmW}" height="${bH}" fill="${eyeColor}"/>`,
      `<rect x="${bracketX1}" y="${cy - bH / 2}" width="${bArmLen}" height="${bArmW}" fill="${eyeColor}"/>`,
      `<rect x="${bracketX1}" y="${cy + bH / 2 - bArmW}" width="${bArmLen}" height="${bArmW}" fill="${eyeColor}"/>`,
      // Right bracket
      `<rect x="${bracketX2 - bArmW}" y="${cy - bH / 2}" width="${bArmW}" height="${bH}" fill="${eyeColor}"/>`,
      `<rect x="${bracketX2 - bArmLen}" y="${cy - bH / 2}" width="${bArmLen}" height="${bArmW}" fill="${eyeColor}"/>`,
      `<rect x="${bracketX2 - bArmLen}" y="${cy + bH / 2 - bArmW}" width="${bArmLen}" height="${bArmW}" fill="${eyeColor}"/>`,
      // Caption text
      `<text x="${textX}" y="${cy}" text-anchor="middle" dominant-baseline="central" ` +
        `font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" ` +
        `font-weight="700" font-size="${fontSize}" letter-spacing="${tracking}" fill="${eyeColor}">${escapeXml(text)}</text>`,
    ].join("");
  }

  // ─ Logo (clean white circle container, centered) ─
  let logoSvg = "";
  if (hasLogo && style.logoDataUrl) {
    const cx = qrX0 + quiet + matrix.size / 2;
    const cy = qrY0 + quiet + matrix.size / 2;
    const logoModules = matrix.size * logoFraction;
    const outerR = logoModules / 2 + Math.max(0.8, style.logoMargin / 5);
    const imgSize = logoModules * 1.02;
    const imgX = cx - imgSize / 2;
    const imgY = cy - imgSize / 2;
    const clipId = `lgc${Math.random().toString(36).slice(2, 8)}`;
    logoSvg = [
      `<defs><clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${outerR - 0.3}"/></clipPath></defs>`,
      `<circle cx="${cx}" cy="${cy}" r="${outerR + 0.25}" fill="${fg}" opacity="0.08"/>`,
      `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="#ffffff"/>`,
      `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${fg}" stroke-opacity="0.18" stroke-width="0.2"/>`,
      `<image href="${escapeXml(style.logoDataUrl)}" x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`,
    ].join("");
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision">` +
    `<rect width="${W}" height="${H}" fill="${bg}"/>` +
    targets +
    `<path d="${dotPaths.join(" ")}" fill="${fg}"/>` +
    eyes +
    logoSvg +
    captionSvg +
    `</svg>`;

  return { svg, width: W, height: H };
}

/**
 * Rasterize an SVG string to a square canvas at the requested pixel size.
 * Used for PNG / JPEG / WebP exports — guarantees the bitmap matches the
 * exact SVG preview (1:1 ratio enforced by the SVG viewBox aspect ratio).
 */
export async function rasterizePremiumSvg(
  svg: string,
  pixelSize: number,
  bg: string,
): Promise<HTMLCanvasElement> {
  // Compute intrinsic ratio from the viewBox so we can size both the canvas
  // and the SVG raster source explicitly (some browsers give 0/300 intrinsic
  // dims for width="100%" SVGs loaded via <img>).
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const vw = vb ? parseFloat(vb[1]) : 1;
  const vh = vb ? parseFloat(vb[2]) : 1;
  const ratio = vh / vw || 1;
  const w = pixelSize;
  const h = Math.round(pixelSize * ratio);
  // Replace the percentage width/height with explicit pixel sizes for raster
  const sized = svg.replace(/width="100%" height="100%"/, `width="${w}" height="${h}"`);
  const blob = new Blob([sized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return cv;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality = 0.95,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
      mime,
      quality,
    );
  });
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
