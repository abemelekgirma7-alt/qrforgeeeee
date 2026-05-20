import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Layers,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { QrPreview } from "./QrPreview";
import { buildQrOptions, type QrStyle } from "@/lib/qr/style";
import {
  buildPremiumQrSvg,
  rasterizePremiumSvg,
  canvasToBlob,
  downloadBlob,
} from "@/lib/qr/renderPremiumQr";
import { extractLogoPalette } from "@/lib/qr/extractColors";
import { chooseBestBlend, DEFAULT_LOGO_OPACITY } from "@/lib/qr/chooseBlend";
import { classifyLogo, adaptiveScaleFor, type LogoClassification } from "@/lib/qr/classifyLogo";
import { AdSlot } from "@/components/site/AdSlot";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sfxDownload, sfxSave } from "@/lib/fx/sound";
import { flyQrToDownloads, flyToDashboard } from "@/lib/fx/flyTo";

type BlendMode = "none" | "darken" | "multiply" | "screen" | "lighten" | "overlay";
type ExportFormat = "svg" | "png" | "jpeg" | "webp";
type LogoPlacement = "center" | "top" | "below";

const SIZES: Record<string, number> = {
  "512": 512,
  "1024": 1024,
  "2048": 2048,
  "4096": 4096,
};

// Brand-blue accent used for the scan-frame brackets + "SCAN ME" caption,
// so the download matches the on-screen preview (primary blue, not QR fg).
const FRAME_ACCENT = "#2563EB";

const BLEND_MODES: { id: BlendMode; label: string }[] = [
  { id: "none", label: "None" },
  { id: "darken", label: "Darken" },
  { id: "multiply", label: "Multiply" },
  { id: "screen", label: "Screen" },
  { id: "lighten", label: "Lighten" },
  { id: "overlay", label: "Overlay" },
];

export function QrWizard({
  data,
  initialStyle,
  filenameHint = "qr-forge",
  onBack,
  initialLogoUrl,
  initialLogoPreset,
}: {
  data: string;
  initialStyle: QrStyle;
  filenameHint?: string;
  onBack: () => void;
  initialLogoUrl?: string | null;
  initialLogoPreset?: { blend: string; opacity: number; scale: number } | null;
}) {
  // Style stripped of any embedded logo — we always render the logo as a
  // full-canvas blend overlay (Inkscape-style), never as a centered inset.
  const [style, setStyle] = useState<QrStyle>({ ...initialStyle, logoDataUrl: null });
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl ?? null);
  const [placement, setPlacement] = useState<LogoPlacement>("center");
  const [blendMode, setBlendMode] = useState<BlendMode>(
    (initialLogoPreset?.blend as BlendMode) ?? "multiply",
  );
  const [logoOpacity, setLogoOpacity] = useState<number>(
    initialLogoPreset?.opacity ?? DEFAULT_LOGO_OPACITY,
  );
  const [logoScale, setLogoScale] = useState<number>(
    initialLogoPreset?.scale ?? 0.95,
  );
  // Snapshot of classifier output — used to recompute adaptive scale when the
  // QR density (payload length / error correction) changes later.
  const [classification, setClassification] = useState<LogoClassification | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  // Default to true 4K per spec — every download is 4096x4096 unless user lowers it.
  const [exportSize, setExportSize] = useState<string>("4096");
  const [filename, setFilename] = useState(filenameHint);
  const [downloading, setDownloading] = useState(false);
  const [autoColor, setAutoColor] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [palette, setPalette] = useState<{ primary: string; secondary: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Adaptive logo auto-scaling: when the QR's density changes (payload size
  // or error correction), re-anchor the logo scale so it still touches the
  // modules with no gap. Only fires when the classifier asked for edgeTouch
  // and the user has not manually overridden the slider yet (we treat the
  // slider as "manual" once it diverges from the last computed adaptive
  // value by more than 2%).
  const lastAdaptiveRef = useRef<number | null>(null);
  useEffect(() => {
    if (!classification || !classification.edgeTouch) return;
    const adapted = adaptiveScaleFor(
      classification.scale,
      data.length,
      style.errorCorrection,
    );
    const prev = lastAdaptiveRef.current;
    // Only auto-update if the user hasn't drifted away from the previous
    // adaptive value (i.e. they haven't grabbed the slider).
    if (prev === null || Math.abs(logoScale - prev) < 0.02) {
      lastAdaptiveRef.current = adapted;
      setLogoScale(adapted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classification, data.length, style.errorCorrection]);

  // Center = small inset logo (no blend). Top / Below = stacked band (no blend overlay).
  const showPreviewOverlay = false;
  const showPreviewCenter = !!logoUrl && placement === "center";
  const isUnderlay = false;

  const applyPalette = (p: { primary: string; secondary: string }) => {
    // Brand-aware mapping (matches the user's KFC/McDonald's reference):
    //   - dots          → DOMINANT brand colour (primary)
    //   - corner squares → ACCENT colour (secondary) so the three finder
    //                      markers pop and don't blend into the body
    //   - corner dots   → DOMINANT colour again, for inner contrast
    setStyle((s) => ({
      ...s,
      fg: p.primary,
      cornerSquareColor: p.secondary,
      cornerDotColor: p.primary,
      gradient: null,
    }));
  };

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawUrl = String(reader.result);
      // Classify the original (un-normalized) image so we can detect a real
      // square-source / transparent-bg logo before center-cropping nukes that
      // information.
      let cls: LogoClassification | null = null;
      try {
        cls = await classifyLogo(rawUrl);
      } catch {
        cls = null;
      }
      // Strict 1:1 mode: source is already perfectly square + transparent bg
      // → use the original pixels (no crop, no resize).
      const url =
        cls?.strict1to1
          ? rawUrl
          : await normalizeLogoSquare(rawUrl, 1024).catch(() => rawUrl);
      setLogoUrl(url);
      setClassification(cls);
      setOptimizing(true);

      // Smart per-logo defaults (replaces the old fixed 95% / 95%).
      if (cls) {
        setBlendMode(cls.blend as BlendMode);
        setLogoOpacity(cls.opacity);
        // Adaptive scale: re-anchor to the current QR payload + EC density so
        // the logo edges meet the modules with no gap.
        const adapted = cls.edgeTouch
          ? adaptiveScaleFor(cls.scale, data.length, style.errorCorrection)
          : cls.scale;
        setLogoScale(adapted);
      } else {
        try {
          const best = await chooseBestBlend(url);
          setBlendMode(best);
        } catch {
          setBlendMode("multiply");
        }
        setLogoOpacity(DEFAULT_LOGO_OPACITY);
        setLogoScale(0.95);
      }
      try {
        const p = await extractLogoPalette(url);
        setPalette(p);
        if (autoColor) applyPalette(p);
      } catch {
        /* ignore */
      }

      // Show optimizing animation for ~7 seconds
      await new Promise((r) => setTimeout(r, 7000));
      setOptimizing(false);
    };
    reader.readAsDataURL(file);
  };

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleLogoUpload(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleLogoUpload(f);
  };

  const removeLogo = () => {
    setLogoUrl(null);
    setPalette(null);
    setClassification(null);
    // Reset QR colors to default black
    setStyle((s) => ({
      ...s,
      fg: "#000000",
      cornerSquareColor: "#000000",
      cornerDotColor: "#000000",
      gradient: null,
    }));
  };

  const toggleAutoColor = (on: boolean) => {
    setAutoColor(on);
    if (on && palette) {
      applyPalette(palette);
    } else if (!on) {
      // Revert QR to default black while keeping the uploaded logo intact.
      setStyle((s) => ({
        ...s,
        fg: "#000000",
        cornerSquareColor: "#000000",
        cornerDotColor: "#000000",
        gradient: null,
      }));
    }
  };

  const performDownload = async () => {
    setDownloading(true);
    try {
      const size = SIZES[exportSize] ?? 2048;
      // Embed the uploaded logo into the QR style so the premium SVG draws
      // it inside the dead-center white disc (WYSIWYG vs preview).
      const exportStyle: QrStyle = {
        ...style,
        logoDataUrl: logoUrl && placement === "center" ? logoUrl : null,
      };
      const { svg } = buildPremiumQrSvg(data, exportStyle, { frame: false });

      if (exportFormat === "svg") {
        downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${filename}.svg`);
      } else {
        const canvas = await rasterizePremiumSvg(svg, size, exportStyle.bg);
        const mime =
          exportFormat === "png"
            ? "image/png"
            : exportFormat === "jpeg"
              ? "image/jpeg"
              : "image/webp";
        const blob = await canvasToBlob(canvas, mime);
        downloadBlob(blob, `${filename}.${exportFormat === "jpeg" ? "jpg" : exportFormat}`);
      }
    } finally {
      setDownloading(false);
    }
  };

  // Direct download — the popup-ad gate was never mounted, so it silently
  // swallowed the callback. Run the export immediately.
  const handleDownload = (e?: React.MouseEvent<HTMLButtonElement>) => {
    sfxDownload();
    flyQrToDownloads(e?.currentTarget as HTMLElement | undefined);
    void performDownload();
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Edit content
        </Button>
        <div className="text-xs text-muted-foreground">Step 2 of 2 · Brand & Download</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] grid-cols-1">
        {/* PREVIEW — premium scan card (built-in corner targets + [SCAN ME]) */}
        <div className="surface-card relative flex items-center justify-center p-4 sm:p-6 md:p-10">
          <div className="relative w-full max-w-[340px] rounded-2xl bg-white p-3 shadow-elev-md">
            {logoUrl && placement === "top" && (
              <div className="mb-2 sm:mb-3 flex justify-center">
                <img src={logoUrl} alt="" className="max-h-16 w-auto object-contain" />
              </div>
            )}
            <QrPreview
              data={data}
              style={{
                ...style,
                logoDataUrl: logoUrl && placement === "center" ? logoUrl : null,
              }}
              size={316}
            />
            {logoUrl && placement === "below" && (
              <div className="mt-2 sm:mt-3 flex justify-center">
                <img src={logoUrl} alt="" className="max-h-16 w-auto object-contain" />
              </div>
            )}
            {optimizing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm font-semibold text-primary animate-pulse">Optimizing…</p>
                <p className="text-[11px] text-muted-foreground">Finding the best blend for your logo</p>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="space-y-6">
          {/* Logo + Blend */}
          <div className="surface-card p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">Brand it with a logo</h3>
              <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Optional
              </span>
            </div>
            {!logoUrl && (
              <p className="mb-3 text-xs text-muted-foreground">
                Skip this if you just want a clean black-and-white QR — go straight to Download below.
              </p>
            )}

            {!logoUrl ? (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/50 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm font-medium">Drop a logo or click to upload</div>
                <div className="text-xs text-muted-foreground">
                  PNG (transparent best) · JPG · SVG — stays in your browser
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickLogo}
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border bg-secondary/50 p-3">
                  <img
                    src={logoUrl}
                    alt="Uploaded logo"
                    className="h-12 w-12 rounded-md object-contain bg-white"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-medium">Logo loaded</div>
                    <div className="text-xs text-muted-foreground">
                      {placement === "center"
                        ? "Small inset in the QR center"
                        : `Stacked ${placement === "top" ? "above" : "below"} the QR, auto-scaled`}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeLogo} aria-label="Remove logo">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Auto color from logo */}
                {palette && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        <Label htmlFor="autocolor" className="cursor-pointer text-sm font-medium">
                          Match QR to logo colors
                        </Label>
                      </div>
                      <Switch id="autocolor" checked={autoColor} onCheckedChange={toggleAutoColor} />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyPalette(palette)}
                        className="flex flex-1 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-primary"
                        title="Use as primary"
                      >
                        <span
                          className="h-6 w-6 rounded-md border"
                          style={{ background: palette.primary }}
                        />
                        <div className="text-xs">
                          <div className="font-semibold">Primary</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {palette.primary.toUpperCase()}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPalette({ primary: palette.secondary, secondary: palette.primary })
                        }
                        className="flex flex-1 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-primary"
                        title="Swap accent and primary"
                      >
                        <span
                          className="h-6 w-6 rounded-md border"
                          style={{ background: palette.secondary }}
                        />
                        <div className="text-xs">
                          <div className="font-semibold">Accent</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {palette.secondary.toUpperCase()}
                          </div>
                        </div>
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Picks the dominant + accent color from your logo and paints the dots and
                      finder corners — like the Telegram / UPS examples.
                    </p>
                  </div>
                )}

                <div>
                  <Label className="mb-2 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" /> Logo placement
                  </Label>
                  <Tabs value={placement} onValueChange={(v) => setPlacement(v as LogoPlacement)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="center">Center</TabsTrigger>
                      <TabsTrigger value="top">Top</TabsTrigger>
                      <TabsTrigger value="below">Below</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Center = small inset inside the QR. Top / Below = stacked band above or below the QR.
                  </p>
                </div>

              </div>
            )}
          </div>

          {/* Export */}
          <div className="surface-card p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">Download</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Format</Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svg">SVG · Vector (editable)</SelectItem>
                    <SelectItem value="png">PNG · Transparent ready</SelectItem>
                    <SelectItem value="jpeg">JPG · Smaller files</SelectItem>
                    <SelectItem value="webp">WebP · Modern web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quality</Label>
                <Select value={exportSize} onValueChange={setExportSize} disabled={exportFormat === "svg"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">512 px</SelectItem>
                    <SelectItem value="1024">1024 px · Print</SelectItem>
                    <SelectItem value="2048">2048 px · Large print</SelectItem>
                    <SelectItem value="4096">4096 px · 4K Ultra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <Label className="text-xs">Filename</Label>
              <Input value={filename} onChange={(e) => setFilename(e.target.value || "qr-forge")} />
            </div>

            <Button
              onClick={(e) => handleDownload(e)}
              size="lg"
              className="mt-4 w-full bg-gradient-hero text-primary-foreground hover:opacity-95"
              disabled={downloading}
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download {exportFormat.toUpperCase()}
            </Button>


            <Button
              onClick={async (e) => {
                if (!user) {
                  toast.info("Sign in to save your QR codes");
                  navigate("/auth");
                  return;
                }
                sfxSave();
                flyToDashboard(e.currentTarget as HTMLElement);
                setSaving(true);
                const { error } = await supabase.from("saved_qrs").insert({
                  user_id: user.id,
                  name: filename || "Untitled QR",
                  qr_type: filenameHint.replace(/^qr-forge-/, "") || "url",
                  payload: data,
                  style: { ...style, logoDataUrl: null } as never,
                  logo_data_url: logoUrl,
                });
                setSaving(false);
                if (error) return toast.error("Couldn't save");
                toast.success("Saved to your dashboard");
              }}
              variant="outline"
              size="lg"
              className="mt-2 w-full"
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save to dashboard
            </Button>

            <button
              onClick={onBack}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              <RotateCcw className="h-3 w-3" /> Start over
            </button>

            {/* Ad slot below Start over */}
            <div className="mt-4">
              <AdSlot size="leaderboard" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Preview wrapper that overlays the logo with a CSS blend mode ---------- */

/**
 * Build a "finders-only" QR overlay: same QR matrix, but the data dots and
 * background are TRANSPARENT — only the three finder squares (corner squares
 * + corner dots) remain visible. This layer is composited ON TOP of the logo
 * so the finders always stay sharp/readable regardless of logo placement,
 * WITHOUT cookie-cutter slicing the logo with a square clip-path.
 *
 * This is what makes circle / rounded / classy corner shapes work correctly
 * with logos: the logo never gets clipped — the actual finder vector renders
 * on top of it instead.
 */
function buildFindersOnlyOptions(data: string, style: QrStyle, size: number) {
  const base = buildQrOptions(data, style, size);
  return {
    ...base,
    backgroundOptions: { color: "rgba(0,0,0,0)" },
    dotsOptions: { ...base.dotsOptions, color: "rgba(0,0,0,0)", gradient: undefined },
    // Keep cornersSquareOptions + cornersDotOptions exactly as-is.
  };
}

function BlendPreview({
  data,
  style,
  size,
  logoUrl,
  blendMode,
  show,
  opacity,
  scale,
  underlay = false,
}: {
  data: string;
  style: QrStyle;
  size: number;
  logoUrl: string | null;
  blendMode: BlendMode;
  show: boolean;
  opacity: number;
  scale: number;
  underlay?: boolean;
}) {
  const overlaySize = size * scale;
  const offset = (size - overlaySize) / 2;
  const logoImg = logoUrl && show ? (
    <img
      src={logoUrl}
      alt=""
      aria-hidden
      className={cn("pointer-events-none absolute object-cover")}
      style={{
        left: offset,
        top: offset,
        width: overlaySize,
        height: overlaySize,
        mixBlendMode:
          blendMode === "none"
            ? ("normal" as React.CSSProperties["mixBlendMode"])
            : (blendMode as React.CSSProperties["mixBlendMode"]),
        opacity,
      }}
    />
  ) : null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {underlay && logoImg}
      <QrPreview data={data} style={style} size={size} />
      {!underlay && logoImg}
      {/* Finder-corners layer ALWAYS on top so the actual corner shape
          (circle / rounded / classy) covers the logo cleanly — no square
          cookie-cutter bite. */}
      {logoImg && (
        <FindersOnlyPreview data={data} style={style} size={size} />
      )}
    </div>
  );
}

function FindersOnlyPreview({
  data,
  style,
  size,
}: {
  data: string;
  style: QrStyle;
  size: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    qrRef.current = new QRCodeStyling(buildFindersOnlyOptions(data, style, size));
    ref.current.innerHTML = "";
    qrRef.current.append(ref.current);
    return () => {
      if (ref.current) ref.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    qrRef.current?.update(buildFindersOnlyOptions(data, style, size));
  }, [data, style, size]);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0"
      style={{ width: size, height: size, lineHeight: 0 }}
      aria-hidden
    />
  );
}

/* ---------- Download helpers ---------- */

// downloadBlob is now imported from @/lib/qr/renderPremiumQr

async function composeCanvasBlend(
  qrCanvas: HTMLCanvasElement,
  logoUrl: string,
  blendMode: BlendMode,
  opacity: number,
  scale: number,
  bg: string,
  underlay = false,
  findersCanvas?: HTMLCanvasElement | null,
): Promise<HTMLCanvasElement> {
  const out = document.createElement("canvas");
  out.width = qrCanvas.width;
  out.height = qrCanvas.height;
  const ctx = out.getContext("2d")!;
  // Sharp QR modules — never let the browser smear our exact-pixel matrix.
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, out.width, out.height);

  const img = await loadImage(logoUrl);
  const targetSize = out.width * scale;
  const targetX = (out.width - targetSize) / 2;
  const targetY = (out.height - targetSize) / 2;
  // Center-crop to fill the square area (no gaps)
  const cropScale = targetSize / Math.min(img.width, img.height);
  const w = img.width * cropScale;
  const h = img.height * cropScale;
  const x = targetX + (targetSize - w) / 2;
  const y = targetY + (targetSize - h) / 2;

  if (underlay) {
    // UNDERLAY: logo behind, then QR on top.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, x, y, w, h);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation =
      blendMode === "none" ? "source-over" : (blendMode as GlobalCompositeOperation);
    ctx.drawImage(qrCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  } else {
    // OVERLAY: QR first (sharp), then logo with blend (smooth scaling for the
    // logo only — QR dots are already drawn). NO polygon clip — the finder
    // corners are re-stamped on top below as their own vector layer.
    ctx.drawImage(qrCanvas, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalCompositeOperation =
      blendMode === "none" ? "source-over" : (blendMode as GlobalCompositeOperation);
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, x, y, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  // FINDERS-ON-TOP layer: the actual corner shape (circle / rounded / classy)
  // re-rendered above the logo so it never gets sliced by a square clip.
  if (findersCanvas) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(findersCanvas, 0, 0, out.width, out.height);
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

/**
 * Normalize an uploaded logo to a 1:1 square at the target size.
 * - If the source is non-square, it's CENTER-CROPPED (zoom to fill) to 1:1.
 * - Result: a PNG data URL that's always square, matching the QR canvas.
 */
async function normalizeLogoSquare(src: string, target = 1024): Promise<string> {
  const img = await loadImage(src);
  const cv = document.createElement("canvas");
  cv.width = target;
  cv.height = target;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, target, target);
  // Crop to fill: scale so the shortest edge fills the square, center-crop the rest.
  const scale = target / Math.min(img.width, img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (target - w) / 2;
  const y = (target - h) / 2;
  ctx.drawImage(img, x, y, w, h);
  return cv.toDataURL("image/png");
}

async function composeCanvasStacked(
  qrCanvas: HTMLCanvasElement,
  logoUrl: string,
  placement: "top" | "below",
  bg: string,
): Promise<HTMLCanvasElement> {
  const img = await loadImage(logoUrl);
  const W = qrCanvas.width;
  // Logo band height is 20% of QR width, logo auto-fits inside.
  const bandH = Math.round(W * 0.22);
  const padding = Math.round(W * 0.04);
  const out = document.createElement("canvas");
  out.width = W;
  out.height = qrCanvas.height + bandH + padding;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, out.width, out.height);

  const innerH = bandH;
  const ratio = Math.min((W * 0.7) / img.width, innerH / img.height);
  const lw = img.width * ratio;
  const lh = img.height * ratio;
  const lx = (W - lw) / 2;

  if (placement === "top") {
    const ly = (bandH - lh) / 2;
    ctx.drawImage(img, lx, ly, lw, lh);
    ctx.drawImage(qrCanvas, 0, bandH + padding);
  } else {
    ctx.drawImage(qrCanvas, 0, 0);
    const ly = qrCanvas.height + padding + (bandH - lh) / 2;
    ctx.drawImage(img, lx, ly, lw, lh);
  }
  return out;
}

function composeSvgWithLogo(
  qrSvg: string,
  logoUrl: string,
  placement: LogoPlacement,
  blendMode: BlendMode,
  opacity: number,
  scale: number,
  bg: string,
  findersSvg?: string | null,
): string {
  const widthMatch = qrSvg.match(/<svg[^>]*\swidth="(\d+)"/);
  const heightMatch = qrSvg.match(/<svg[^>]*\sheight="(\d+)"/);
  const w = widthMatch ? parseInt(widthMatch[1], 10) : 1024;
  const h = heightMatch ? parseInt(heightMatch[1], 10) : 1024;

  if (placement === "center") {
    const overlay = w * scale;
    const x = (w - overlay) / 2;
    const y = (h - overlay) / 2;
    const blendAttr =
      blendMode === "none"
        ? `style="opacity:${opacity}"`
        : `style="mix-blend-mode:${blendMode};opacity:${opacity}"`;
    // Inline the finders-only SVG (inner contents only) so the actual corner
    // shape sits ON TOP of the logo — no square clip slicing.
    const findersInner = findersSvg
      ? findersSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1] ?? ""
      : "";
    return qrSvg.replace(
      /<\/svg>/,
      `<image href="${logoUrl}" x="${x}" y="${y}" width="${overlay}" height="${overlay}" preserveAspectRatio="xMidYMid meet" ${blendAttr}/>${findersInner}</svg>`,
    );
  }

  // Top / Below: wrap the original QR svg inside a larger SVG with a logo band.
  const bandH = Math.round(w * 0.22);
  const padding = Math.round(w * 0.04);
  const totalH = h + bandH + padding;
  const logoW = w * 0.7;
  const logoX = (w - logoW) / 2;
  const qrY = placement === "top" ? bandH + padding : 0;
  const logoY = placement === "top" ? 0 : h + padding;

  // Strip outer <svg ...> wrapper from inner qrSvg, keep its inner content.
  const innerMatch = qrSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  const inner = innerMatch ? innerMatch[1] : qrSvg;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${totalH}" viewBox="0 0 ${w} ${totalH}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g transform="translate(0,${qrY})">${inner}</g>
  <image href="${logoUrl}" x="${logoX}" y="${logoY}" width="${logoW}" height="${bandH}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
}

/* ---------- Scan frame (corner brackets + "SCAN ME" caption) ---------- */
// Mirrors the on-screen .scan-frame wrapper so what the user sees is what they get.

function wrapWithScanFrame(
  source: HTMLCanvasElement,
  bg: string,
  accent: string,
): HTMLCanvasElement {
  const W = source.width;
  const H = source.height;
  // Generous padding so the L-shaped corner brackets always have white space
  // around them (was 6% — getting clipped on smaller exports).
  const pad = Math.round(W * 0.12);
  const captionH = Math.round(W * 0.11);
  const out = document.createElement("canvas");
  out.width = W + pad * 2;
  out.height = H + pad * 2 + captionH;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, out.width, out.height);
  // Place the QR
  ctx.drawImage(source, pad, pad);
  // Corner brackets
  const armLen = Math.round(W * 0.08);
  const armW = Math.max(3, Math.round(W * 0.012));
  ctx.fillStyle = accent;
  const corners = [
    [0, 0, 1, 1],
    [out.width - armLen, 0, -1, 1],
    [0, H + pad * 2 - armW, 1, -1],
    [out.width - armLen, H + pad * 2 - armW, -1, -1],
  ] as const;
  // Draw L-shaped brackets at the four outer corners of the framed area
  const frameW = out.width;
  const frameH = H + pad * 2;
  function bracket(x: number, y: number, dx: number, dy: number) {
    // horizontal arm
    ctx.fillRect(dx > 0 ? x : x + armLen - armW, y + (dy > 0 ? 0 : armLen - armW), armW, armLen);
    // vertical arm
    ctx.fillRect(x + (dx > 0 ? 0 : armLen - armW), dy > 0 ? y : y + armLen - armW, armLen, armW);
  }
  bracket(0, 0, 1, 1);
  bracket(frameW - armLen, 0, -1, 1);
  bracket(0, frameH - armLen, 1, -1);
  bracket(frameW - armLen, frameH - armLen, -1, -1);
  // Caption
  ctx.fillStyle = accent;
  const fontSize = Math.round(captionH * 0.55);
  ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Letter-spacing approximation by drawing each char
  const text = "SCAN ME";
  const tracking = fontSize * 0.25;
  const widths = [...text].map((c) => ctx.measureText(c).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + tracking * (text.length - 1);
  let cx = out.width / 2 - totalW / 2;
  const cy = frameH + captionH / 2;
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], cx + widths[i] / 2, cy);
    cx += widths[i] + tracking;
  }
  return out;
}

function wrapSvgWithScanFrame(svgText: string, bg: string, accent: string): string {
  const wm = svgText.match(/<svg[^>]*\swidth="(\d+(?:\.\d+)?)"/);
  const hm = svgText.match(/<svg[^>]*\sheight="(\d+(?:\.\d+)?)"/);
  const w = wm ? parseFloat(wm[1]) : 1024;
  const h = hm ? parseFloat(hm[1]) : 1024;
  const pad = Math.round(w * 0.12);
  const captionH = Math.round(w * 0.11);
  const totalW = w + pad * 2;
  const totalH = h + pad * 2 + captionH;
  const armLen = Math.round(w * 0.08);
  const armW = Math.max(3, Math.round(w * 0.012));
  const frameH = h + pad * 2;
  const inner = svgText.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1] ?? svgText;
  const fontSize = Math.round(captionH * 0.55);
  const bracket = (x: number, y: number, dx: number, dy: number) => {
    const hx = dx > 0 ? x : x + armLen - armW;
    const hy = y + (dy > 0 ? 0 : armLen - armW);
    const vx = x + (dx > 0 ? 0 : armLen - armW);
    const vy = dy > 0 ? y : y + armLen - armW;
    return `<rect x="${hx}" y="${hy}" width="${armW}" height="${armLen}" fill="${accent}"/><rect x="${vx}" y="${vy}" width="${armLen}" height="${armW}" fill="${accent}"/>`;
  };
  const brackets =
    bracket(0, 0, 1, 1) +
    bracket(totalW - armLen, 0, -1, 1) +
    bracket(0, frameH - armLen, 1, -1) +
    bracket(totalW - armLen, frameH - armLen, -1, -1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g transform="translate(${pad},${pad})">${inner}</g>
  ${brackets}
  <text x="${totalW / 2}" y="${frameH + captionH / 2}" text-anchor="middle" dominant-baseline="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="${fontSize}" letter-spacing="${Math.round(fontSize * 0.25)}" fill="${accent}">SCAN ME</text>
</svg>`;
}
