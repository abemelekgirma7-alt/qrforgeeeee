import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  Loader2,
  Palette,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { defaultStyle, type QrStyle } from "@/lib/qr/style";
import { extractLogoPalette } from "@/lib/qr/extractColors";
import { chooseBestBlend, DEFAULT_LOGO_OPACITY } from "@/lib/qr/chooseBlend";
import { buildPremiumQrSvg, rasterizePremiumSvg, canvasToBlob } from "@/lib/qr/renderPremiumQr";
import { QrPreview } from "./QrPreview";
import { BulkTypeDialog, type BulkType, type BulkDialogResult } from "./BulkTypeDialog";
import { cn } from "@/lib/utils";
import { sfxDownload } from "@/lib/fx/sound";
import { flyQrToDownloads } from "@/lib/fx/flyTo";

/* ── Type detection ────────────────────────────────────────── */

type DetectedType = BulkType;
type BulkRow = { raw: string; label: string; payload: string; detected: DetectedType; locked: boolean };

const URL_RE = /^(https?:\/\/|www\.)\S+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{7,}$/;
const WIFI_RE = /^WIFI:T:.+;/i;
const IG_RE = /^@?[a-zA-Z0-9._]{1,30}$/;

function detect(raw: string): DetectedType {
  const s = raw.trim();
  if (WIFI_RE.test(s)) return "wifi";
  if (URL_RE.test(s)) return "url";
  if (EMAIL_RE.test(s)) return "email";
  if (PHONE_RE.test(s)) return "phone";
  if (IG_RE.test(s) && s.startsWith("@")) return "instagram";
  return "text";
}

function toPayload(raw: string, t: DetectedType): string {
  const s = raw.trim();
  switch (t) {
    case "url": return s.startsWith("http") ? s : `https://${s}`;
    case "email": return `mailto:${s}`;
    case "phone": return `tel:${s.replace(/[\s().-]/g, "")}`;
    case "instagram": return `https://instagram.com/${s.replace(/^@/, "")}`;
    default: return s;
  }
}

function safeFilename(s: string, idx: number): string {
  const cleaned = s.replace(/^https?:\/\//, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return `${String(idx + 1).padStart(3, "0")}-${cleaned || "qr"}`;
}

const PLACEHOLDERS = [
  "Type a URL, phone number, email, or text…",
  "Paste your website link…",
  "Enter a phone number…",
  "Type an email address…",
  "Add WiFi: WIFI:T:WPA;S:MyNetwork;P:password;;",
];

const ALL_TYPES: DetectedType[] = ["url", "text", "wifi", "phone", "email", "vcard", "menu", "wedding", "rsvp", "instagram", "payment", "ticket", "pdf"];

type LogoPlacement = "center" | "top" | "below";
type BlendMode = "none" | "darken" | "multiply" | "screen" | "lighten" | "overlay";


/* ── Clip-path for finder corners ──────────────────────────── */
const B = 22;
const CLIP_PATH = `polygon(0% ${B}%, ${B}% ${B}%, ${B}% 0%, ${100-B}% 0%, ${100-B}% ${B}%, 100% ${B}%, 100% 100%, ${B}% 100%, ${B}% ${100-B}%, 0% ${100-B}%)`;

export function BulkGenerator() {
  /* ── State ── */
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<LogoPlacement>("center");
  const [blendMode, setBlendMode] = useState<BlendMode>("multiply");
  const [logoOpacity, setLogoOpacity] = useState(DEFAULT_LOGO_OPACITY);
  const [logoScale, setLogoScale] = useState(0.8);
  const [bulkStyle, setBulkStyle] = useState<QrStyle>(defaultStyle);
  const [activeIdx, setActiveIdx] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typing, setTyping] = useState("");
  const [showEnterHint, setShowEnterHint] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Animated placeholder ── */
  useEffect(() => {
    let charIdx = 0;
    let forward = true;
    const text = PLACEHOLDERS[placeholderIdx];
    const interval = setInterval(() => {
      if (forward) {
        charIdx++;
        setTyping(text.slice(0, charIdx));
        if (charIdx >= text.length) {
          forward = false;
          setTimeout(() => {}, 1500);
        }
      } else {
        charIdx--;
        setTyping(text.slice(0, charIdx));
        if (charIdx <= 0) {
          forward = true;
          setPlaceholderIdx((p) => (p + 1) % PLACEHOLDERS.length);
        }
      }
    }, 60);
    return () => clearInterval(interval);
  }, [placeholderIdx]);

  /* ── Show enter hint when user types ── */
  useEffect(() => {
    setShowEnterHint(input.trim().length > 0 && !generated);
  }, [input, generated]);

  /* ── Type picker dialog state ── */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitialValue, setDialogInitialValue] = useState("");
  const [dialogInitialType, setDialogInitialType] = useState<BulkType>("url");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const openDialogForNew = () => {
    const raw = input.trim();
    if (!raw) return;
    setEditingIdx(null);
    setDialogInitialValue(raw);
    setDialogInitialType(detect(raw));
    setDialogOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      openDialogForNew();
    }
  };

  const handleDialogSubmit = (result: BulkDialogResult) => {
    const newRow: BulkRow = {
      raw: result.label,
      label: result.label,
      payload: result.payload,
      detected: result.type,
      locked: true,
    };
    if (editingIdx !== null) {
      setRows((prev) => prev.map((r, i) => (i === editingIdx ? newRow : r)));
    } else {
      setRows((prev) => [...prev, newRow]);
      setInput("");
    }
    setDialogOpen(false);
    setEditingIdx(null);
    setGenerated(false);
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
    setGenerated(false);
  };

  // Switching a row's type now opens the dialog so the user can re-enter
  // the required fields for the new type (e.g. text → ticket).
  const changeType = (idx: number, newType: DetectedType) => {
    const row = rows[idx];
    if (!row) return;
    setEditingIdx(idx);
    setDialogInitialValue(row.label);
    setDialogInitialType(newType);
    setDialogOpen(true);
  };


  /* ── Logo upload ── */
  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result);
      setLogoUrl(url);
      try {
        const best = await chooseBestBlend(url);
        setBlendMode(best);
      } catch {
        setBlendMode("multiply");
      }
      setLogoOpacity(DEFAULT_LOGO_OPACITY);
      setLogoScale(0.8);
      // Auto-extract brand palette → apply to QR fg + corner colors (still scannable, EC stays H)
      try {
        const p = await extractLogoPalette(url);
        setBulkStyle((s) => ({
          ...s,
          fg: p.primary,
          cornerSquareColor: p.secondary,
          cornerDotColor: p.primary,
          gradient: null,
        }));
      } catch {
        /* ignore */
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoUrl(null);
    setBulkStyle(defaultStyle);
  };

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleLogoUpload(f);
  };

  /* ── CSV upload ── */
  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const newRows = lines.map(line => {
        const detected = detect(line);
        return { raw: line, label: line, payload: toPayload(line, detected), detected, locked: true } as BulkRow;
      });
      setRows(prev => [...prev, ...newRows]);
      setGenerated(false);
    };
    reader.readAsText(f);
  };

  /* ── Generate ── */
  const doGenerate = () => {
    if (!rows.length) return;
    setGenerated(true);
    setActiveIdx(0);
  };

  /* ── Download ZIP ── */
  const performDownload = async () => {
    if (!rows.length) return;
    setBusy(true);
    setProgress(0);
    const zip = new JSZip();
    const px = 2048;

    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // Embed the uploaded logo (if any) into the style so the premium
        // SVG renders it inside the dead-center white disc.
        const rowStyle: QrStyle = {
          ...bulkStyle,
          logoDataUrl: logoUrl && placement === "center" ? logoUrl : null,
        };
        const { svg } = buildPremiumQrSvg(row.payload, rowStyle, { frame: false });
        const canvas = await rasterizePremiumSvg(svg, px, rowStyle.bg);
        const blob = await canvasToBlob(canvas, "image/png");
        zip.file(`${safeFilename(row.label, i)}.png`, blob);
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      const manifest =
        "filename,label,detected_type,payload\n" +
        rows.map((r, i) =>
          `${safeFilename(r.label, i)}.png,"${r.label.replace(/"/g, '""')}",${r.detected},"${r.payload.replace(/"/g, '""')}"`
        ).join("\n");
      zip.file("manifest.csv", manifest);

      const out = await zip.generateAsync({ type: "blob" });
      saveAs(out, `qr-forge-bulk-${rows.length}.zip`);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const handleDownload = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (!rows.length) return;
    sfxDownload();
    if (e?.currentTarget) flyQrToDownloads(e.currentTarget as HTMLElement);
    void performDownload();
  };

  const activeRow = rows[activeIdx];

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
      {/* LEFT: form column */}
      <div className="surface-card p-4 sm:p-6 md:p-8 animate-fade-in-up space-y-6 min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Bulk QR generator</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Add entries, upload your logo, and generate branded QR codes for all at once.
            </p>
          </div>
        </div>

        {/* ── INPUT BOX with animated placeholder ── */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Add entries
          </Label>
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={typing}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-20 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {showEnterHint && (
              <button
                onClick={openDialogForNew}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover animate-scale-in"
              >
                Enter ↵
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border bg-secondary px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary">
              <Upload className="h-3 w-3" /> Upload CSV / TXT
              <input type="file" accept=".csv,.txt" className="hidden" onChange={onFileUpload} />
            </label>
          </div>
        </div>

        {/* ── ENTRIES LIST ── */}
        {rows.length > 0 && (
          <div className="rounded-xl border bg-secondary/40 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> {rows.length} entries
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
              {rows.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-md bg-card px-3 py-2 text-xs"
                >
                  <span className="truncate font-medium flex-1">{r.label}</span>
                  <select
                    value={r.detected}
                    onChange={(e) => changeType(i, e.target.value as DetectedType)}
                    className="rounded border bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                  >
                    {ALL_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOGO PLACEMENT + UPLOAD ── */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Logo placement
          </Label>
          <Tabs value={placement} onValueChange={(v) => setPlacement(v as LogoPlacement)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="top">Top</TabsTrigger>
              <TabsTrigger value="center">Middle</TabsTrigger>
              <TabsTrigger value="below">Below</TabsTrigger>
            </TabsList>
          </Tabs>
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upload logo (optional)
          </Label>
          {!logoUrl ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/50 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm font-medium">Drop a logo or click to upload</div>
              <div className="text-xs text-muted-foreground">PNG · JPG · SVG</div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border bg-secondary/50 p-3">
              <img src={logoUrl} alt="" className="h-12 w-12 rounded-md object-cover bg-white" />
              <div className="flex-1 text-sm font-medium">Logo loaded</div>
              <Button variant="ghost" size="icon" onClick={removeLogo}>
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>

        {/* ── COLORS (collapsible) ── */}
        <Collapsible open={colorsOpen} onOpenChange={setColorsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition-all hover:border-primary/50">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Palette className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Colors</span>
                <span className="block text-[11px] text-muted-foreground">
                  Foreground · Background · Corner ring · Corner dot
                </span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="hidden items-center gap-1 sm:flex">
                <BulkSwatch color={bulkStyle.fg} />
                <BulkSwatch color={bulkStyle.bg} />
                <BulkSwatch color={bulkStyle.cornerSquareColor || bulkStyle.fg} />
                <BulkSwatch color={bulkStyle.cornerDotColor || bulkStyle.fg} />
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", colorsOpen && "rotate-180")} />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 rounded-xl border bg-secondary/30 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BulkColorField id="b-fg" label="Foreground (dots)" value={bulkStyle.fg} onChange={(v) => setBulkStyle((s) => ({ ...s, fg: v, gradient: null }))} />
              <BulkColorField id="b-bg" label="Background" value={bulkStyle.bg} onChange={(v) => setBulkStyle((s) => ({ ...s, bg: v }))} />
              <BulkColorField id="b-csq" label="Corner ring" value={bulkStyle.cornerSquareColor || bulkStyle.fg} onChange={(v) => setBulkStyle((s) => ({ ...s, cornerSquareColor: v }))} />
              <BulkColorField id="b-cdot" label="Corner dot" value={bulkStyle.cornerDotColor || bulkStyle.fg} onChange={(v) => setBulkStyle((s) => ({ ...s, cornerDotColor: v }))} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── PATTERN & CORNERS (collapsible) ── */}
        <Collapsible open={patternOpen} onOpenChange={setPatternOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition-all hover:border-primary/50">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Pattern & corners</span>
                <span className="block text-[11px] text-muted-foreground">
                  Dot style · Corner shape · Error correction
                </span>
              </span>
            </span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", patternOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-5 rounded-xl border bg-secondary/30 p-4">
            <div>
              <Label className="mb-2 block">Dot style</Label>
              <Tabs value={bulkStyle.dotStyle as string} onValueChange={(v) => setBulkStyle((s) => ({ ...s, dotStyle: v as QrStyle["dotStyle"] }))}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="rounded">Rounded</TabsTrigger>
                  <TabsTrigger value="dots">Dots</TabsTrigger>
                  <TabsTrigger value="classy-rounded">Classy</TabsTrigger>
                  <TabsTrigger value="extra-rounded">Extra</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <Label className="mb-2 block">Corner shape</Label>
              <Tabs value={bulkStyle.cornerSquareStyle as string} onValueChange={(v) => setBulkStyle((s) => ({ ...s, cornerSquareStyle: v as QrStyle["cornerSquareStyle"] }))}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="dot">Dot</TabsTrigger>
                  <TabsTrigger value="extra-rounded">Rounded</TabsTrigger>
                  <TabsTrigger value="classy-rounded">Classy</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <Label className="mb-2 block">Corner dot</Label>
              <Tabs value={bulkStyle.cornerDotStyle as string} onValueChange={(v) => setBulkStyle((s) => ({ ...s, cornerDotStyle: v as QrStyle["cornerDotStyle"] }))}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="dot">Dot</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <Label className="mb-2 block">Error correction</Label>
              <Tabs value={bulkStyle.errorCorrection} onValueChange={(v) => setBulkStyle((s) => ({ ...s, errorCorrection: v as QrStyle["errorCorrection"] }))}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="L">Low</TabsTrigger>
                  <TabsTrigger value="M">Medium</TabsTrigger>
                  <TabsTrigger value="Q">Quartile</TabsTrigger>
                  <TabsTrigger value="H">High</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── GENERATE + RESET ── */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={doGenerate}
            size="lg"
            className="flex-1 bg-gradient-hero text-primary-foreground hover:opacity-95"
            disabled={!rows.length}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate {rows.length} QR code{rows.length !== 1 ? "s" : ""}
          </Button>
          <Button
            size="lg"
            variant="outline"
            type="button"
            className="sm:w-auto"
            onClick={() => {
              setInput("");
              setRows([]);
              setLogoUrl(null);
              setPlacement("center");
              setBlendMode("multiply");
              setLogoOpacity(DEFAULT_LOGO_OPACITY);
              setLogoScale(0.8);
              setBulkStyle(defaultStyle);
              setActiveIdx(0);
              setGenerated(false);
              setColorsOpen(false);
              setPatternOpen(false);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            Reset
          </Button>
        </div>

        {/* ── DOWNLOAD ── */}
        {generated && (
          <Button
            onClick={handleDownload}
            size="lg"
            className="w-full"
            variant="outline"
            disabled={busy}
          >
            {busy ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating… {progress}%</>
            ) : (
              <><Download className="mr-2 h-4 w-4" /> Download ZIP ({rows.length} codes · 4K)</>
            )}
          </Button>
        )}
      </div>

      {/* RIGHT: live preview — sticky, always visible */}
      <div className="surface-card w-full p-6 animate-fade-in-up lg:sticky lg:top-24">
        <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground text-shadow-soft">
          Live preview
        </h3>
        {generated && rows.length > 0 ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 justify-center w-full">
              <button
                onClick={() => setActiveIdx((p) => (p > 0 ? p - 1 : rows.length - 1))}
                aria-label="Previous QR"
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground hover:text-primary hover:border-primary transition-colors shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="w-full max-w-[180px] sm:max-w-[240px] lg:max-w-[280px] aspect-square rounded-2xl bg-white p-2 shadow-elev-md flex items-center justify-center">
                <QrPreview
                  data={activeRow?.payload || " "}
                  style={{
                    ...bulkStyle,
                    logoDataUrl: logoUrl && placement === "center" ? logoUrl : null,
                  }}
                  frame={false}
                />
              </div>
              <button
                onClick={() => setActiveIdx((p) => (p < rows.length - 1 ? p + 1 : 0))}
                aria-label="Next QR"
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground hover:text-primary hover:border-primary transition-colors shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
              {activeRow?.detected}
            </span>
            <p className="text-xs text-muted-foreground truncate max-w-[240px] text-center">
              {activeRow?.label}
            </p>
            <p className="text-[10px] text-muted-foreground">{activeIdx + 1} / {rows.length}</p>
          </div>
        ) : (
          <div className="mx-auto flex aspect-square w-full max-w-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/30 p-6 text-center">
            <Layers className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              Add entries and click Generate to preview your QR codes here.
            </p>
          </div>
        )}
      </div>

      <BulkTypeDialog
        open={dialogOpen}
        initialValue={dialogInitialValue}
        initialType={dialogInitialType}
        onClose={() => { setDialogOpen(false); setEditingIdx(null); }}
        onSubmit={handleDialogSubmit}
      />
    </div>
  );
}

/* ── Canvas compose helper for download ── */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

async function composeCanvasWithLogo(
  qrCanvas: HTMLCanvasElement,
  logoUrl: string,
  blendMode: BlendMode,
  opacity: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  const out = document.createElement("canvas");
  out.width = qrCanvas.width;
  out.height = qrCanvas.height;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(qrCanvas, 0, 0);

  const img = await loadImage(logoUrl);
  const targetSize = out.width * scale;
  const x = (out.width - targetSize) / 2;
  const y = (out.height - targetSize) / 2;

  const bite = out.width * 0.22;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, bite);
  ctx.lineTo(bite, bite);
  ctx.lineTo(bite, 0);
  ctx.lineTo(out.width - bite, 0);
  ctx.lineTo(out.width - bite, bite);
  ctx.lineTo(out.width, bite);
  ctx.lineTo(out.width, out.height);
  ctx.lineTo(bite, out.height);
  ctx.lineTo(bite, out.height - bite);
  ctx.lineTo(0, out.height - bite);
  ctx.closePath();
  ctx.clip();

  ctx.globalCompositeOperation = blendMode === "none" ? "source-over" : blendMode as GlobalCompositeOperation;
  ctx.globalAlpha = opacity;
  ctx.drawImage(img, x, y, targetSize, targetSize);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
  return out;
}

function BulkSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-4 w-4 rounded-full border border-border shadow-sm"
      style={{ background: color }}
    />
  );
}

function BulkColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
