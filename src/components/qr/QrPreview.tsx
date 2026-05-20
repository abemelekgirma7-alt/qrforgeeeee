import { useMemo } from "react";
import type { QrStyle } from "@/lib/qr/style";
import { buildPremiumQrSvg } from "@/lib/qr/renderPremiumQr";
import { cn } from "@/lib/utils";

/**
 * Premium QR preview.
 *
 * The SVG fills its parent container while preserving aspect ratio.
 * Wrap in an `aspect-square` element to get a perfect 1:1 QR that
 * scales responsively to fill the available width.
 */
export function QrPreview({
  data,
  style,
  size,
  className,
  frame = false,
  caption,
}: {
  data: string;
  style: QrStyle;
  /** Optional fixed pixel size. Omit to fill parent container. */
  size?: number;
  className?: string;
  frame?: boolean;
  caption?: string;
}) {
  const { svg, width, height } = useMemo(
    () => buildPremiumQrSvg(data, style, { frame, caption }),
    [data, style, frame, caption],
  );
  const ratio = height / width;
  const style2: React.CSSProperties = size
    ? { width: size, height: size * ratio, lineHeight: 0, overflow: "hidden" }
    : { width: "100%", maxWidth: "100%", aspectRatio: `${width} / ${height}`, lineHeight: 0, overflow: "hidden" };
  return (
    <div
      className={cn("[&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:max-w-full", className)}
      style={style2}
      role="img"
      aria-label="QR code"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
