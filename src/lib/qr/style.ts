import QRCodeStyling, {
  type Options as QRStylingOptions,
  type DotType,
  type CornerSquareType,
  type CornerDotType,
} from "qr-code-styling";

export type QrStyle = {
  fg: string;
  bg: string;
  dotStyle: DotType;
  cornerSquareStyle: CornerSquareType;
  cornerDotStyle: CornerDotType;
  /** Color of the three large finder squares (outer ring). Defaults to fg. */
  cornerSquareColor?: string;
  /** Color of the inner dot inside the three finder squares. Defaults to fg. */
  cornerDotColor?: string;
  logoDataUrl?: string | null;
  logoSize: number; // 0.1 - 0.4
  logoMargin: number; // px
  errorCorrection: "L" | "M" | "Q" | "H";
  gradient?: { from: string; to: string } | null;
};

export const defaultStyle: QrStyle = {
  fg: "#000000",
  bg: "#ffffff",
  dotStyle: "dots",
  cornerSquareStyle: "extra-rounded",
  cornerDotStyle: "dot",
  cornerSquareColor: "#000000",
  cornerDotColor: "#000000",
  logoDataUrl: null,
  logoSize: 0.25,
  logoMargin: 6,
  errorCorrection: "H",
  gradient: null,
};

export function buildQrOptions(data: string, style: QrStyle, size = 512): QRStylingOptions {
  const dotsOptions: QRStylingOptions["dotsOptions"] = style.gradient
    ? {
        type: style.dotStyle,
        gradient: {
          type: "linear",
          rotation: 0.785,
          colorStops: [
            { offset: 0, color: style.gradient.from },
            { offset: 1, color: style.gradient.to },
          ],
        },
      }
    : { type: style.dotStyle, color: style.fg };

  return {
    width: size,
    height: size,
    data: data || " ",
    // Tighter quiet-zone margin → individual modules visually appear thinner /
    // more refined, especially for "dots" and "classy" styles. Still ≥ 4 modules
    // which is the QR spec minimum for reliable scanning.
    margin: 4,
    type: "svg",
    qrOptions: { errorCorrectionLevel: style.errorCorrection, typeNumber: 0, mode: "Byte" },
    backgroundOptions: { color: style.bg },
    dotsOptions,
    cornersSquareOptions: { type: style.cornerSquareStyle, color: style.cornerSquareColor || style.fg },
    cornersDotOptions: { type: style.cornerDotStyle, color: style.cornerDotColor || style.fg },
    image: style.logoDataUrl || undefined,
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: style.logoSize,
      margin: style.logoMargin,
      crossOrigin: "anonymous",
    },
  };
}

export function createQr(data: string, style: QrStyle, size = 512) {
  return new QRCodeStyling(buildQrOptions(data, style, size));
}
