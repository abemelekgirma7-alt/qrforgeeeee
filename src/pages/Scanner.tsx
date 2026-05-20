import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";
import {
  Camera,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  ScanLine,
  Upload,
  XCircle,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SCAN_TIMEOUT_MS = 30000;

function getScannerErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError") return "Camera permission was denied. Please allow access and try again.";
    if (error.name === "NotFoundError") return "No camera was found on this device.";
    if (error.name === "NotReadableError") return "Your camera is already being used by another app.";
    if (error.name === "OverconstrainedError") return "This camera setup is not available on this device.";
  }
  return "We couldn't start the camera scanner on this device.";
}

/**
 * Functional QR scanner — camera (with permission prompt) + file upload.
 * Uses @zxing/browser. Responsive, with a scanning-line animation.
 * Auth-gated: requires the user to be signed in.
 */
export default function Scanner() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"camera" | "upload">("camera");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [permission, setPermission] = useState<"idle" | "granted" | "denied">("idle");
  const [scanTimedOut, setScanTimedOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    document.title = "QR Scanner — QR Forge";
  }, []);

  // Reader with hints (QR only is faster, but accept all formats too)
  const buildReader = () => {
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.AZTEC,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.PDF_417,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    return new BrowserMultiFormatReader(hints);
  };

  const reader = useMemo(() => buildReader(), []);

  const clearScanTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const stopCamera = () => {
    clearScanTimeout();
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  const startCamera = async () => {
    setError(null);
    setResult(null);
    setScanTimedOut(false);
    stopCamera();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermission("denied");
        setError("Camera access is not supported in this browser.");
        return;
      }

      const permissionProbe = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      permissionProbe.getTracks().forEach((track) => track.stop());

      setPermission("granted");
      setScanning(true);
      timeoutRef.current = window.setTimeout(() => {
        setScanTimedOut(true);
        setScanning(false);
        setError("We couldn't identify a QR code after 30 seconds. Try better lighting, a steadier frame, or upload an image instead.");
        controlsRef.current?.stop();
      }, SCAN_TIMEOUT_MS);

      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
        },
        videoRef.current!,
        (res, err) => {
          if (res) {
            clearScanTimeout();
            setResult(res.getText());
            controlsRef.current?.stop();
            setScanning(false);
            toast({ title: "QR code scanned!", description: "Result is ready below." });
          }
          if (err && !(err instanceof NotFoundException)) {
            setError("There was a problem while scanning. Please try again.");
          }
        },
      );
      controlsRef.current = controls;
    } catch (e) {
      setPermission("denied");
      setScanning(false);
      clearScanTimeout();
      setError(getScannerErrorMessage(e));
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Switching tabs stops the camera
  useEffect(() => {
    if (tab !== "camera") stopCamera();
  }, [tab]);

  /* ── Upload scan ── */
  const decodeFile = async (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WebP, or SVG).");
      return;
    }
    setError(null);
    setResult(null);
    setUploadBusy(true);
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    const url = URL.createObjectURL(f);
    setUploadPreview(url);
    try {
      const res = await reader.decodeFromImageUrl(url);
      setResult(res.getText());
      toast({ title: "QR code scanned!", description: "Result is ready below." });
    } catch {
      setError("No QR code found in that image. Try a clearer or tighter crop.");
    } finally {
      setUploadBusy(false);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await decodeFile(f);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) await decodeFile(f);
  };

  const reset = () => {
    stopCamera();
    setResult(null);
    setError(null);
    setScanTimedOut(false);
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Auth gate ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent("/scanner")}`} replace />;
  }

  const isUrl = result?.match(/^https?:\/\//i);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ScanLine className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">QR Scanner</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Scan any QR code with your camera, or upload an image to decode.
          </p>
        </div>

        <div className="surface-card p-4 sm:p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">
                <Camera className="mr-2 h-4 w-4" /> Camera
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" /> Upload image
              </TabsTrigger>
            </TabsList>

            {/* ── CAMERA ── */}
            <TabsContent value="camera" className="mt-4">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl bg-black sm:max-w-[420px] lg:max-w-[520px]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Frame overlay */}
                <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-white/70">
                  <span className="absolute -left-px -top-px h-6 w-6 rounded-tl-xl border-l-4 border-t-4 border-primary" />
                  <span className="absolute -right-px -top-px h-6 w-6 rounded-tr-xl border-r-4 border-t-4 border-primary" />
                  <span className="absolute -bottom-px -left-px h-6 w-6 rounded-bl-xl border-b-4 border-l-4 border-primary" />
                  <span className="absolute -bottom-px -right-px h-6 w-6 rounded-br-xl border-b-4 border-r-4 border-primary" />
                  {scanning && (
                    <span
                      className="absolute inset-x-0 h-1 rounded bg-primary shadow-[0_0_18px_hsl(var(--primary))]"
                      style={{ animation: "scan-line 2s linear infinite" }}
                    />
                  )}
                </div>
                {!scanning && !result && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-center text-white">
                    <Camera className="h-10 w-10 opacity-80" />
                    <p className="max-w-xs px-4 text-sm text-white/80">
                      Start the camera to scan. You'll be asked to grant camera permission.
                    </p>
                  </div>
                )}
                </div>

                <div className="rounded-2xl border bg-secondary/30 p-4 sm:p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scanner controls</div>
                  <div className="mt-3 space-y-3">
                    {!scanning ? (
                      <Button onClick={startCamera} className="w-full bg-gradient-hero text-primary-foreground">
                        <Camera className="mr-2 h-4 w-4" />
                        {permission === "denied" ? "Start scanning again" : "Start scanning"}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={stopCamera} className="w-full">
                        <XCircle className="mr-2 h-4 w-4" /> Stop scanning
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => setTab("upload")}>
                      <Upload className="mr-2 h-4 w-4" /> Scan uploaded QR
                    </Button>
                    <div className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">
                      {scanning
                        ? "Point your camera at the QR code and hold still for a moment."
                        : "Use the button above to trigger the camera permission prompt and begin scanning."}
                    </div>
                    {scanTimedOut && (
                      <p className="text-sm text-destructive">
                        No QR code was detected in 30 seconds.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── UPLOAD ── */}
            <TabsContent value="upload" className="mt-4">
              <div className="mx-auto w-full max-w-md space-y-3">
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "relative block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
                    dragOver
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/40 hover:border-primary hover:bg-primary/5",
                  )}
                >
                  {uploadPreview ? (
                    <div className="relative">
                      <img
                        src={uploadPreview}
                        alt="Uploaded QR"
                        className="mx-auto max-h-72 rounded-xl object-contain"
                      />
                      {uploadBusy && (
                        <span
                          className="absolute inset-x-0 h-1 rounded bg-primary shadow-[0_0_18px_hsl(var(--primary))]"
                          style={{ animation: "scan-line 1.6s linear infinite" }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {dragOver ? "Drop the image to scan" : "Drag & drop a QR image here"}
                      </p>
                      <p className="text-xs text-muted-foreground">or use the button below — PNG · JPG · WebP · SVG</p>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickFile}
                  />
                </label>
                <Button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadBusy}
                  className="w-full bg-gradient-hero text-primary-foreground"
                >
                  {uploadBusy ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Decoding…</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> Upload image & scan</>
                  )}
                </Button>
                {uploadPreview && !uploadBusy && (
                  <Button type="button" variant="outline" className="w-full" onClick={reset}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Choose a different image
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>


          {/* ── RESULT ── */}
          {(result || error) && (
            <div className="mt-6 rounded-2xl border bg-card p-5">
                  {result && (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <Button size="sm" variant="secondary" disabled className="opacity-100">
                      Scanned
                    </Button>
                  </div>
                  <p className="break-all rounded-lg bg-secondary/50 p-3 text-sm font-medium">
                    {result}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(result);
                        toast({ title: "Copied to clipboard" });
                      }}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" /> Copy
                    </Button>
                    {isUrl && (
                      <a
                        href={result}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open link
                      </a>
                    )}
                    <Button size="sm" variant="ghost" onClick={reset}>
                      <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Scan another
                    </Button>
                  </div>
                </>
              )}
              {error && !result && (
                <div className="flex items-start gap-3 text-sm text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">{error}</p>
                    <Button size="sm" variant="ghost" onClick={reset} className="mt-2">
                      <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Try again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need to create one instead?{" "}
          <Link to="/" className="text-primary hover:underline">
            Generate a QR code
          </Link>
          .
        </p>
      </main>

      {/* keyframes for scan line */}
      <style>{`
        @keyframes scan-line {
          0%   { top: 0%; opacity: 0.2; }
          10%  { opacity: 1; }
          50%  { top: 100%; opacity: 1; }
          51%  { opacity: 0; }
          60%  { top: 0%; opacity: 0; }
          70%  { opacity: 1; }
          100% { top: 0%; opacity: 0.2; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
