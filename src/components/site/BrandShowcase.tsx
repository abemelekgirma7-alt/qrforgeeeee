import { useEffect, useMemo, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { buildQrOptions, type QrStyle } from "@/lib/qr/style";
import { DEFAULT_LOGO_OPACITY } from "@/lib/qr/chooseBlend";
import netflixLogo from "@/assets/brands/netflix.png";
import spotifyLogo from "@/assets/brands/spotify.webp";
import youtubeLogo from "@/assets/brands/youtube.png";
import nikeLogo from "@/assets/brands/nike.jpg";
import tiktokLogo from "@/assets/brands/tiktok.jpg";
import kfcLogo from "@/assets/brands/kfc.png";
import mcdonaldsLogo from "@/assets/brands/mcdonalds.png";
import instagramLogo from "@/assets/brands/instagram.svg";

type Brand = {
  name: string;
  url: string;
  logo: string;
  color: string;
  accent: string;
  blend: string;
  opacity: number;
  scale: number;
};

const BRANDS: Brand[] = [
  { name: "TikTok",     url: "https://www.tiktok.com",    logo: tiktokLogo,    color: "#000000", accent: "#FE2C55", blend: "multiply", opacity: 0.95, scale: 0.82 },
  { name: "YouTube",    url: "https://www.youtube.com",   logo: youtubeLogo,   color: "#FF0000", accent: "#282828", blend: "multiply", opacity: 0.95, scale: 0.78 },
  { name: "McDonald's", url: "https://www.mcdonalds.com", logo: mcdonaldsLogo, color: "#DA291C", accent: "#FFC72C", blend: "darken",   opacity: 0.95, scale: 0.78 },
  { name: "Spotify",    url: "https://open.spotify.com",  logo: spotifyLogo,   color: "#1DB954", accent: "#191414", blend: "multiply", opacity: 0.95, scale: 0.80 },
  { name: "Instagram",  url: "https://www.instagram.com", logo: instagramLogo, color: "#E1306C", accent: "#833AB4", blend: "multiply", opacity: 0.95, scale: 0.75 },
  { name: "Netflix",    url: "https://www.netflix.com",   logo: netflixLogo,   color: "#E50914", accent: "#221F1F", blend: "multiply", opacity: 0.95, scale: 0.78 },
  { name: "KFC",        url: "https://www.kfc.com",       logo: kfcLogo,       color: "#E4002B", accent: "#1E1E1E", blend: "darken",   opacity: 0.95, scale: 0.85 },
  { name: "Nike",       url: "https://www.nike.com",      logo: nikeLogo,      color: "#111111", accent: "#FA5400", blend: "darken",   opacity: 0.95, scale: 0.80 },
];

/**
 * Clip-path that removes logo pixels where the three QR finder squares sit
 * (top-left, top-right, bottom-left). This ensures the corner markers stay
 * fully visible and scannable ON TOP of the logo overlay.
 * 22% bite matches the finder module proportions.
 */
const B = 22;
const CLIP_PATH =
  `polygon(` +
  `0% ${B}%, ${B}% ${B}%, ${B}% 0%, ` +
  `${100 - B}% 0%, ${100 - B}% ${B}%, 100% ${B}%, ` +
  `100% 100%, ${B}% 100%, ${B}% ${100 - B}%, ` +
  `0% ${100 - B}%` +
  `)`;

function BrandQr({ brand, size = 200 }: { brand: Brand; size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const style: QrStyle = useMemo(
    () => ({
      fg: brand.color,
      // Always pure white — brand QRs must look identical in both light & dark mode.
      bg: "#ffffff",
      dotStyle: "dots",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      cornerSquareColor: brand.accent,
      cornerDotColor: brand.color,
      logoDataUrl: null,
      errorCorrection: "H",
      logoSize: 0.25,
      logoMargin: 0,
      gradient: null,
    }),
    [brand],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const qr = new QRCodeStyling(buildQrOptions(brand.url, style, size));
    containerRef.current.innerHTML = "";
    qr.append(containerRef.current);
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    }, [brand, style, size]);

  const overlaySize = size * brand.scale;
  const offset = (size - overlaySize) / 2;

  return (
    <div
      className="relative rounded-xl bg-white p-2 shadow-sm"
      style={{ width: size + 16, height: size + 16, lineHeight: 0 }}
      aria-label={`${brand.name} QR code example`}
      role="img"
    >
      {/* QR code base layer */}
      <div ref={containerRef} style={{ width: size, height: size }} />
      {/* Logo overlay — sits ON TOP of QR with blend mode.
          The clip-path cuts out the three finder corners so they remain
          fully visible above the logo (Netflix-style). */}
      <img
        src={brand.logo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute object-cover"
        style={{
          left: offset + 8,
          top: offset + 8,
          width: overlaySize,
          height: overlaySize,
          mixBlendMode: brand.blend as React.CSSProperties["mixBlendMode"],
          opacity: brand.opacity,
          clipPath: CLIP_PATH,
          WebkitClipPath: CLIP_PATH,
        }}
      />
    </div>
  );
}

/** Custom event dispatched when a brand card is clicked in the showcase */
export const BRAND_CLICK_EVENT = "qrforge:brand-click";
export type BrandClickDetail = {
  logoUrl: string;
  name: string;
  color: string;
  accent: string;
  blend: string;
  opacity: number;
  scale: number;
};

export function BrandShowcase() {
  const track = [...BRANDS, ...BRANDS];

  return (
    <section className="mt-16 sm:mt-20">
      <div className="container mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Examples
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
          Branded QR codes from real companies
        </h2>
        <p className="mt-3 text-xs text-muted-foreground sm:text-sm md:text-base">
          Coming soon…
        </p>
      </div>

      <div
        className="relative mt-10 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
        }}
      >
        <div className="marquee-track flex w-max gap-4 px-4">
          {track.map((brand, i) => (
            <article
              key={`${brand.name}-${i}`}
              title="Coming soon..."
              aria-label={`${brand.name} — coming soon`}
              className="surface-card group relative flex w-[200px] shrink-0 cursor-not-allowed flex-col items-center gap-3 p-4 transition-transform duration-200 hover:scale-105 hover:shadow-xl sm:w-[260px] sm:p-5"
            >
              <BrandQr brand={brand} size={180} />
              <div className="text-center">
                <div className="text-sm font-bold sm:text-base" style={{ color: brand.color }}>
                  Coming soon...
                </div>
                <div className="text-[10px] text-muted-foreground sm:text-[11px]">
                  {brand.name}
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-background/0 opacity-0 backdrop-blur-0 transition-all duration-200 group-hover:bg-background/85 group-hover:opacity-100 group-hover:backdrop-blur-sm">
                <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-elev-md">
                  Coming soon…
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
