import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Camera,
  CameraOff,
  Download,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  LogOut,
  Menu,
  Pause,
  Pencil,
  Play,
  Plus,
  QrCode,
  Search,
  Settings,
  SlidersHorizontal,
  Smile,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { buildPremiumQrSvg, rasterizePremiumSvg, canvasToBlob, downloadBlob } from "@/lib/qr/renderPremiumQr";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrPreview } from "@/components/qr/QrPreview";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defaultStyle, type QrStyle } from "@/lib/qr/style";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateShortCode, scanUrlFor } from "@/lib/api/shortCode";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";

type DynamicQr = {
  id: string;
  short_code: string;
  name: string;
  qr_type: string;
  destination: string;
  status: string;
  scan_count: number;
  scan_limit: number | null;
  folder_id: string | null;
  tags: string[];
  campaign: string | null;
  created_at: string;
};
type SavedQr = {
  id: string;
  name: string;
  qr_type: string;
  payload: string;
  style: QrStyle;
  logo_data_url: string | null;
  created_at: string;
};
type Folder = { id: string; name: string; color: string };

type View = "all" | "folders" | "analytics" | "templates" | "settings";

const GLOWS = [
  "shadow-[0_0_40px_-8px_hsl(217_91%_60%/0.7)]",
  "shadow-[0_0_40px_-8px_hsl(320_85%_60%/0.7)]",
  "shadow-[0_0_40px_-8px_hsl(150_75%_50%/0.7)]",
  "shadow-[0_0_40px_-8px_hsl(35_95%_55%/0.7)]",
  "shadow-[0_0_40px_-8px_hsl(265_85%_65%/0.7)]",
  "shadow-[0_0_40px_-8px_hsl(190_85%_55%/0.7)]",
];

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<DynamicQr[] | null>(null);
  const [saved, setSaved] = useState<SavedQr[] | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | "all" | "untagged">("all");
  const [creating, setCreating] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null }>({ display_name: null, avatar_url: null });

  useEffect(() => {
    document.title = "dashboard";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const refresh = async () => {
    if (!user) return;
    const [{ data: qrs }, { data: fls }, { data: sv }, { data: pr }] = await Promise.all([
      supabase.from("dynamic_qrs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("folders").select("id,name,color").eq("user_id", user.id).order("name"),
      supabase.from("saved_qrs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("display_name,avatar_url").eq("id", user.id).maybeSingle(),
    ]);
    setItems((qrs ?? []) as DynamicQr[]);
    setFolders((fls ?? []) as Folder[]);
    setSaved(((sv ?? []) as any[]).map((r) => ({ ...r, style: { ...defaultStyle, ...(r.style as object) } as QrStyle })));
    if (pr) setProfile({ display_name: pr.display_name ?? null, avatar_url: pr.avatar_url ?? null });
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  const filtered = useMemo(() => {
    if (!items) return null;
    const out = items.filter((q) => {
      if (activeFolder === "untagged" && q.folder_id) return false;
      if (activeFolder !== "all" && activeFolder !== "untagged" && q.folder_id !== activeFolder) return false;
      if (filterType !== "all" && q.qr_type !== filterType) return false;
      if (search && !`${q.name} ${q.destination} ${q.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (sortBy === "oldest") out.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else if (sortBy === "name") out.sort((a, b) => a.name.localeCompare(b.name));
    else out.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return out;
  }, [items, activeFolder, search, filterType, sortBy]);

  const createDynamic = async () => {
    if (!user) return;
    const destination = prompt("Destination URL for this dynamic QR:")?.trim();
    if (!destination) return;
    setCreating(true);
    const code = generateShortCode();
    const { error } = await supabase.from("dynamic_qrs").insert({
      user_id: user.id, short_code: code, name: destination.slice(0, 60), destination,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Dynamic QR created");
    refresh();
  };

  const newFolder = async () => {
    if (!user) return;
    const name = prompt("Folder name:")?.trim();
    if (!name) return;
    const { error } = await supabase.from("folders").insert({ user_id: user.id, name });
    if (error) return toast.error(error.message);
    refresh();
  };

  const setStatus = async (id: string, status: string) => {
    await supabase.from("dynamic_qrs").update({ status }).eq("id", id);
    refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this dynamic QR?")) return;
    await supabase.from("dynamic_qrs").delete().eq("id", id);
    refresh();
  };
  const removeSaved = async (id: string) => {
    if (!confirm("Delete this saved QR?")) return;
    await supabase.from("saved_qrs").delete().eq("id", id);
    refresh();
  };

  if (authLoading || !user) {
    return <AuthLoadingScreen message="Opening your dashboard…" />;
  }

  const totalScans = items?.reduce((s, i) => s + i.scan_count, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="container max-w-2xl pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 text-sm">
                <Link to="/" className="rounded-lg px-3 py-2 hover:bg-secondary">Generator</Link>
                <Link to="/blog" className="rounded-lg px-3 py-2 hover:bg-secondary">Blog</Link>
                <Link to="/about" className="rounded-lg px-3 py-2 hover:bg-secondary">About</Link>
                <Link to="/contact" className="rounded-lg px-3 py-2 hover:bg-secondary">Contact</Link>
                <button onClick={() => setScannerOpen(true)} className="rounded-lg px-3 py-2 text-left hover:bg-secondary">QR Scanner</button>
                <div className="my-2 border-t" />
                <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                  Theme <ThemeToggle />
                </div>
                <button onClick={async () => { await signOut(); navigate("/", { replace: true }); }} className="rounded-lg px-3 py-2 text-left text-destructive hover:bg-secondary">
                  <LogOut className="mr-2 inline h-4 w-4" /> Sign out
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>


        {/* Search */}
        {(view === "all" || view === "templates") && (
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search QR codes..."
                className="h-11 rounded-2xl border-border/60 bg-card pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl" aria-label="Filters">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSortBy("newest")}>{sortBy === "newest" ? "✓ " : ""}Newest first</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>{sortBy === "oldest" ? "✓ " : ""}Oldest first</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>{sortBy === "name" ? "✓ " : ""}Name (A–Z)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Content type</DropdownMenuLabel>
                {["all", "url", "text", "wifi", "email", "phone", "sms", "vcard"].map((t) => (
                  <DropdownMenuItem key={t} onClick={() => setFilterType(t)}>
                    {filterType === t ? "✓ " : ""}{t === "all" ? "All types" : t.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>

      {/* Body */}
      <main className="container max-w-2xl mt-5">
        {view === "all" && (
          <ListDynamic items={filtered} onCreate={() => navigate("/#generator")} creating={creating} setStatus={setStatus} remove={remove} />
        )}
        {view === "folders" && (
          <FoldersView
            folders={folders}
            items={items ?? []}
            activeFolder={activeFolder}
            setActiveFolder={(f) => { setActiveFolder(f); setView("all"); }}
            newFolder={newFolder}
          />
        )}
        {view === "analytics" && (
          <AnalyticsView items={items ?? []} totalScans={totalScans} />
        )}
        {view === "templates" && (
          <SavedView items={saved} remove={removeSaved} search={search} />
        )}
        {view === "settings" && <SettingsView email={user.email ?? ""} userId={user.id} profile={profile} onProfileChange={(p) => setProfile(p)} onSignOut={async () => { await signOut(); navigate("/", { replace: true }); }} />}
      </main>

      {/* Floating Add — single create button, redirects to QR Generator */}
      <button
        onClick={() => navigate("/#generator")}
        aria-label="Create new QR code"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-5px_hsl(var(--primary)/0.6)] transition-transform hover:scale-110 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/90 backdrop-blur-md">
        <div className="container max-w-2xl grid grid-cols-4 py-2 text-[10px]">
          <BottomBtn icon={LayoutGrid} label="Dashboard" active={view === "all"} onClick={() => setView("all")} />
          <BottomBtn icon={BarChart3} label="Analytics" active={view === "analytics"} onClick={() => setView("analytics")} />
          <BottomBtn icon={ImageIcon} label="Saved" active={view === "templates"} onClick={() => setView("templates")} />
          <BottomBtn icon={UserIcon} label="Profile">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full flex-col items-center gap-0.5 py-1 text-muted-foreground hover:text-foreground">
                  {profile.avatar_url ? (
                    profile.avatar_url.startsWith("emoji:") ? (
                      <span className="text-xl leading-none">{profile.avatar_url.slice(6)}</span>
                    ) : (
                      <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                    )
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                  <span>Profile</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuLabel className="text-xs">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setView("folders")}>
                  <FolderOpen className="mr-2 h-4 w-4" /> Folders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")}>Home</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScannerOpen(true)}>Scanner</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={async () => { await signOut(); navigate("/", { replace: true }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>

            </DropdownMenu>
          </BottomBtn>
        </div>
      </nav>

      {/* Scanner sheet */}
      <Sheet open={scannerOpen} onOpenChange={setScannerOpen}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader><SheetTitle>QR Scanner</SheetTitle></SheetHeader>
          <Scanner />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BottomBtn({
  icon: Icon, label, active, onClick, highlight, children,
}: { icon: typeof LayoutGrid; label: string; active?: boolean; onClick?: () => void; highlight?: boolean; children?: React.ReactNode }) {
  if (children) return <>{children}</>;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 py-1 transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn(
        "flex items-center justify-center rounded-full transition-all",
        highlight ? "h-9 w-9 bg-primary text-primary-foreground shadow-[0_6px_16px_-4px_hsl(var(--primary)/0.6)]" : "h-6 w-6",
      )}>
        <Icon className={cn(highlight ? "h-5 w-5" : "h-5 w-5")} />
      </span>
      <span>{label}</span>
    </button>
  );
}

function ListDynamic({
  items, onCreate, creating, setStatus, remove,
}: {
  items: DynamicQr[] | null;
  onCreate: () => void;
  creating: boolean;
  setStatus: (id: string, s: string) => void;
  remove: (id: string) => void;
}) {
  if (items === null) return <Spinner />;
  if (items.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 p-10 text-center">
        <QrCode className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-semibold">No QR codes yet</h3>
        <p className="text-sm text-muted-foreground">Create your first dynamic QR to start tracking scans.</p>
        <Button onClick={onCreate} disabled={creating} className="gap-1.5">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} New QR
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((q, i) => {
        const scanUrl = scanUrlFor(q.short_code);
        const glow = GLOWS[i % GLOWS.length];
        return (
          <article key={q.id} className="surface-card flex items-center gap-4 p-4">
            <div className={cn("rounded-2xl bg-white p-2 transition-all", glow)}>
              <QrPreview data={scanUrl} style={defaultStyle} size={72} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-bold">{q.name}</h3>
                {q.status === "active" && (
                  <Badge className="h-4 bg-emerald-500/15 px-1.5 text-[9px] font-semibold text-emerald-500 hover:bg-emerald-500/15">Live</Badge>
                )}
                {q.status !== "active" && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{q.status}</Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{q.destination}</p>
              <div className="mt-2 flex gap-4 text-[10px]">
                <div>
                  <div className="font-bold text-foreground">{q.scan_count.toLocaleString()}</div>
                  <div className="uppercase tracking-wider text-muted-foreground">Scans</div>
                </div>
                <div>
                  <div className="font-bold text-foreground">{new Date(q.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                  <div className="uppercase tracking-wider text-muted-foreground">Created</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="icon" onClick={() => setStatus(q.id, q.status === "active" ? "paused" : "active")} aria-label="Toggle status">
                {q.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(q.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function FoldersView({
  folders, items, activeFolder, setActiveFolder, newFolder,
}: {
  folders: Folder[]; items: DynamicQr[];
  activeFolder: string | "all" | "untagged";
  setActiveFolder: (f: string | "all" | "untagged") => void;
  newFolder: () => void;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Folders</h2>
        <Button size="sm" variant="outline" onClick={newFolder} className="gap-1"><Plus className="h-3.5 w-3.5" /> New</Button>
      </div>
      <div className="mt-3 grid gap-2">
        <FolderRow label="All" count={items.length} active={activeFolder === "all"} onClick={() => setActiveFolder("all")} />
        <FolderRow label="Untagged" count={items.filter((i) => !i.folder_id).length} active={activeFolder === "untagged"} onClick={() => setActiveFolder("untagged")} />
        {folders.map((f) => (
          <FolderRow key={f.id} label={f.name} color={f.color} count={items.filter((i) => i.folder_id === f.id).length} active={activeFolder === f.id} onClick={() => setActiveFolder(f.id)} />
        ))}
      </div>
    </div>
  );
}
function FolderRow({ label, count, color, active, onClick }: { label: string; count: number; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors", active ? "bg-primary/10 text-primary" : "hover:bg-secondary")}>
      <span className="flex items-center gap-2 text-sm font-medium">
        <FolderOpen className="h-4 w-4" style={color ? { color } : undefined} />
        {label}
      </span>
      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </button>
  );
}

function AnalyticsView({ items, totalScans }: { items: DynamicQr[]; totalScans: number }) {
  const top = [...items].sort((a, b) => b.scan_count - a.scan_count).slice(0, 5);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total QR codes" value={items.length} />
        <Stat label="Total scans" value={totalScans} />
        <Stat label="Active" value={items.filter((i) => i.status === "active").length} />
        <Stat label="Paused" value={items.filter((i) => i.status === "paused").length} />
      </div>
      <div className="surface-card p-4">
        <h3 className="text-sm font-bold">Top performers</h3>
        {top.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No scans yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {top.map((q) => (
              <li key={q.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                <span className="truncate">{q.name}</span>
                <span className="font-bold">{q.scan_count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-4">
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function SavedView({ items, remove, search }: { items: SavedQr[] | null; remove: (id: string) => void; search: string }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  const handleDownload = async (q: SavedQr) => {
    setBusy(q.id);
    try {
      const { svg } = buildPremiumQrSvg(q.payload, q.style, { frame: false });
      const canvas = await rasterizePremiumSvg(svg, 2048, q.style.bg);
      const blob = await canvasToBlob(canvas, "image/png");
      downloadBlob(blob, `${(q.name || "qr").replace(/[^a-z0-9-_]+/gi, "-")}.png`);
      toast.success("Downloaded");
    } catch (e) {
      toast.error("Couldn't download QR");
    } finally {
      setBusy(null);
    }
  };

  const handleEdit = (q: SavedQr) => {
    // Stash so the generator can pre-fill payload/style when it loads
    try {
      sessionStorage.setItem("qrforge.edit", JSON.stringify({ payload: q.payload, style: q.style, name: q.name, qr_type: q.qr_type }));
    } catch { /* ignore */ }
    navigate("/#generator");
  };

  if (items === null) return <Spinner />;
  const filtered = items.filter((q) => !search || `${q.name} ${q.payload}`.toLowerCase().includes(search.toLowerCase()));
  if (filtered.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 p-10 text-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-semibold">No saved QRs</h3>
        <Link to="/"><Button>Create one</Button></Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {filtered.map((q, i) => (
        <article key={q.id} className="surface-card flex items-center gap-3 p-4">
          <div className={cn("rounded-2xl bg-white p-2", GLOWS[i % GLOWS.length])}>
            <QrPreview data={q.payload} style={q.style} size={72} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold">{q.name}</h3>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{q.payload}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleDownload(q)} disabled={busy === q.id} aria-label="Download">
              {busy === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleEdit(q)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(q.id)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

const EMOJI_AVATARS = ["😀", "😎", "🤖", "🦊", "🐱", "🐶", "🦁", "🐼", "🚀", "⭐", "🔥", "🎨", "🎯", "💎", "🌟", "🍀"];

function SettingsView({
  email, userId, profile, onProfileChange, onSignOut,
}: {
  email: string;
  userId: string;
  profile: { display_name: string | null; avatar_url: string | null };
  onProfileChange: (p: { display_name: string | null; avatar_url: string | null }) => void;
  onSignOut: () => void;
}) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDisplayName(profile.display_name ?? ""); }, [profile.display_name]);

  const saveAvatar = async (avatar_url: string | null) => {
    const { error } = await supabase.from("profiles").upsert({ id: userId, avatar_url, display_name: displayName || null });
    if (error) return toast.error(error.message);
    onProfileChange({ display_name: displayName || null, avatar_url });
    toast.success("Profile updated");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error("Max 2MB");
    const reader = new FileReader();
    reader.onload = () => saveAvatar(String(reader.result));
    reader.readAsDataURL(f);
  };

  const renderAvatar = () => {
    if (!profile.avatar_url) return <UserIcon className="h-10 w-10 text-muted-foreground" />;
    if (profile.avatar_url.startsWith("emoji:")) return <span className="text-4xl">{profile.avatar_url.slice(6)}</span>;
    return <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="surface-card p-4">
        <h3 className="text-sm font-bold">Profile</h3>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-secondary">
            {renderAvatar()}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" onBlur={() => saveAvatar(profile.avatar_url)} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Upload photo
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5"><Smile className="h-3.5 w-3.5" /> Emoji</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="grid grid-cols-8 gap-1 p-2">
                    {EMOJI_AVATARS.map((e) => (
                      <button key={e} onClick={() => saveAvatar(`emoji:${e}`)} className="rounded p-1 text-xl hover:bg-secondary">{e}</button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              {profile.avatar_url && (
                <Button size="sm" variant="ghost" onClick={() => saveAvatar(null)}>Clear</Button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Signed in as <span className="font-medium text-foreground">{email}</span></p>
      </div>
      <div className="surface-card flex items-center justify-between p-4">
        <div>
          <h3 className="text-sm font-bold">Theme</h3>
          <p className="text-xs text-muted-foreground">Light, system, or dark.</p>
        </div>
        <ThemeToggle />
      </div>
      <div className="surface-card p-4">
        <h3 className="text-sm font-bold">More</h3>
        <div className="mt-3 grid gap-2">
          <Link to="/" className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary">Generator</Link>
          <Link to="/about" className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary">About us</Link>
          <Link to="/contact" className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary">Contact support</Link>
          <Link to="/privacy" className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary">Privacy policy</Link>
          <Link to="/terms" className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary">Terms of service</Link>
        </div>
      </div>
      <Button variant="destructive" onClick={onSignOut} className="gap-2"><LogOut className="h-4 w-4" /> Sign out</Button>
    </div>
  );
}

function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [active, setActive] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null); setResult(null);
    try {
      // Pre-flight permission request so the browser shows the prompt
      // immediately and we can surface a clear error if it's denied.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      // Stop preflight tracks — ZXing will reopen via decodeFromVideoDevice.
      stream.getTracks().forEach((t) => t.stop());
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (res) => {
        if (res) { setResult(res.getText()); controls.stop(); controlsRef.current = null; setActive(false); }
      });
      controlsRef.current = controls; setActive(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't access the camera.";
      setError(/denied|permission/i.test(msg) ? "Camera permission denied. Please allow camera access in your browser settings." : msg);
    }
  };
  const stop = () => { controlsRef.current?.stop(); controlsRef.current = null; setActive(false); };
  useEffect(() => () => controlsRef.current?.stop(), []);
  const isUrl = result && /^https?:\/\//i.test(result);

  // Auto-open URL results after a short pause so users can cancel
  useEffect(() => {
    if (!result || !isUrl) return;
    const t = setTimeout(() => { window.open(result, "_blank", "noopener,noreferrer"); }, 1200);
    return () => clearTimeout(t);
  }, [result, isUrl]);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        {!active && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Camera className="h-10 w-10" /><p className="text-sm">Tap "Start scanning" — your browser will ask for camera permission.</p>
          </div>
        )}
        {active && (
          <>
            {/* Corner brackets */}
            <div className="pointer-events-none absolute inset-8 rounded-2xl">
              {[
                "top-0 left-0 border-l-4 border-t-4 rounded-tl-2xl",
                "top-0 right-0 border-r-4 border-t-4 rounded-tr-2xl",
                "bottom-0 left-0 border-l-4 border-b-4 rounded-bl-2xl",
                "bottom-0 right-0 border-r-4 border-b-4 rounded-br-2xl",
              ].map((c) => (
                <span key={c} className={cn("absolute h-12 w-12 border-primary", c)} />
              ))}
            </div>
            {/* Scanning laser */}
            <div className="pointer-events-none absolute inset-8 overflow-hidden rounded-2xl">
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_4px_hsl(var(--primary)/0.8)] animate-[scan_2s_linear_infinite]" />
            </div>
            <style>{`@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`}</style>
          </>
        )}
      </div>
      <div className="flex justify-center">
        {!active ? (
          <Button onClick={start} className="gap-2"><Camera className="h-4 w-4" /> Start scanning</Button>
        ) : (
          <Button onClick={stop} variant="secondary" className="gap-2"><CameraOff className="h-4 w-4" /> Stop</Button>
        )}
      </div>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      {result && (
        <div className="surface-card p-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm break-all">{result}</div>
          {isUrl && <p className="mt-2 text-xs text-muted-foreground">Opening link in a new tab…</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }}>Copy</Button>
            {isUrl && <a href={result} target="_blank" rel="noreferrer"><Button size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Open now</Button></a>}
            <Button variant="ghost" size="sm" onClick={start}>Scan another</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() { return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>; }
