import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Send, Sparkles, Star, X } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { sfxStar, sfxSubmit } from "@/lib/fx/sound";
import { flyPaperPlane, flyStars } from "@/lib/fx/flyTo";

const SUPPORT_EMAIL = "abimelekgirma@gmail.com";
const MIN_REVIEW = 20;
const MAX_REVIEW = 800;
const MAX_NAME = 60;
const MAX_ROLE = 80;

export default function ShareReview() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = (file: File | null) => {
    if (!file) { setImagePreview(null); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Honeypot — bots fill hidden fields
    if (website.trim()) { toast.success("Thanks! Your review is pending approval."); return; }

    // Validation
    const trimmedName = name.trim();
    const trimmedText = text.trim();
    if (!trimmedName || trimmedName.length > MAX_NAME) return toast.error("Please add your name");
    if (rating < 1 || rating > 5) return toast.error("Please choose a star rating");
    if (trimmedText.length < MIN_REVIEW) return toast.error(`Review must be at least ${MIN_REVIEW} characters`);
    if (trimmedText.length > MAX_REVIEW) return toast.error(`Review must be under ${MAX_REVIEW} characters`);
    if (role.trim().length > MAX_ROLE) return toast.error("Role is too long");
    // crude link-spam filter
    const linkCount = (trimmedText.match(/https?:\/\//gi) || []).length;
    if (linkCount > 2) return toast.error("Too many links in review");

    // Client-side rate limit — one submission per 60s, max 3 per day
    try {
      const now = Date.now();
      const last = Number(localStorage.getItem("rev_last") || 0);
      if (now - last < 60_000) return toast.error("Please wait a moment before submitting again");
      const dayKey = "rev_day_" + new Date().toISOString().slice(0, 10);
      const dayCount = Number(localStorage.getItem(dayKey) || 0);
      if (dayCount >= 3) return toast.error("Daily review limit reached. Try again tomorrow.");
      localStorage.setItem("rev_last", String(now));
      localStorage.setItem(dayKey, String(dayCount + 1));
    } catch { /* localStorage unavailable — proceed */ }

    setSubmitting(true);
    sfxSubmit();
    flyPaperPlane((e.target as HTMLFormElement).querySelector('button[type="submit"]') as HTMLElement | null);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("reviews").insert({
      name: trimmedName,
      role: role.trim() || null,
      rating,
      review_text: trimmedText,
      avatar_url: imagePreview,
      approved: false,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks! Your review is pending approval.");
    setTimeout(() => navigate("/", { replace: true }), 800);
  };

  const onStarKey = (e: React.KeyboardEvent, v: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setRating(Math.min(5, v + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setRating(Math.max(1, v - 1));
    } else if (e.key === "Home") { e.preventDefault(); setRating(1); }
      else if (e.key === "End") { e.preventDefault(); setRating(5); }
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); setRating(v); }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar />
      <div className="container mt-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>

      <section className="container relative mx-auto mt-8 max-w-2xl pb-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 opacity-40 blur-3xl"
             style={{ background: "radial-gradient(circle at center, hsl(var(--primary) / 0.4), transparent 60%)" }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative glass-panel rounded-3xl p-7 shadow-elev-lg sm:p-10"
        >
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Share your story
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-shadow-soft sm:text-4xl"
                style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif', letterSpacing: "-0.02em" }}>
              Tell us how <span className="text-gradient">QR Forge</span> helped you
            </h1>
            <p className="mt-3 text-sm text-muted-foreground text-shadow-soft">
              Real stories help other creators. We read every word.
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label>Your rating</Label>
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Star rating">
                {Array.from({ length: 5 }).map((_, i) => {
                  const v = i + 1;
                  const filled = v <= (hoverStar || rating);
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={rating === v}
                      tabIndex={rating === v || (rating === 0 && v === 1) ? 0 : -1}
                      onMouseEnter={() => setHoverStar(v)}
                      onMouseLeave={() => setHoverStar(0)}
                      onFocus={() => setHoverStar(v)}
                      onBlur={() => setHoverStar(0)}
                      onClick={(ev) => {
                        setRating(v);
                        sfxStar(v);
                        flyStars(ev.currentTarget as HTMLElement, v);
                      }}
                      onKeyDown={(e) => onStarKey(e, v)}
                      className="rounded-md p-1 transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`${v} star${v > 1 ? "s" : ""}`}
                    >
                      <Star className={`h-8 w-8 ${filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rev-name">Your name</Label>
                <Input id="rev-name" value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rev-role">Role (optional)</Label>
                <Input id="rev-role" value={role} maxLength={MAX_ROLE} onChange={(e) => setRole(e.target.value)} placeholder="Café owner, designer..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="rev-text">Your review</Label>
                <span className={`text-xs ${text.length > MAX_REVIEW * 0.9 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {text.length}/{MAX_REVIEW}
                </span>
              </div>
              <Textarea
                id="rev-text"
                rows={5}
                value={text}
                maxLength={MAX_REVIEW}
                onChange={(e) => setText(e.target.value)}
                placeholder="What did you build with QR Forge? What surprised you?"
                required
              />
              <p className="text-xs text-muted-foreground">Minimum {MIN_REVIEW} characters.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Photo (optional)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="preview" className="h-24 w-24 rounded-xl border object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute -right-2 -top-2 rounded-full bg-background p-0.5 shadow-elev-sm"
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  <ImagePlus className="h-4 w-4" /> Add a photo
                </button>
              )}
            </div>

            {/* honeypot — hidden from real users */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />
            <Button type="submit" disabled={submitting} className="h-12 w-full text-base">
              <Send className="mr-2 h-4 w-4" /> {submitting ? "Sending…" : "Send my review"}
            </Button>
          </form>
        </motion.div>
      </section>
      <Footer />
    </div>
  );
}