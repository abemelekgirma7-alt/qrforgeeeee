import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Star, Trash2, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Review = {
  id: string;
  name: string;
  role: string | null;
  rating: number;
  review_text: string;
  avatar_url: string | null;
  approved: boolean;
  created_at: string;
};

export default function AdminReviews() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<Review[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Review moderation";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    (async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (error) { setIsAdmin(false); return; }
      setIsAdmin(Boolean(data));
    })();
  }, [user, authLoading, navigate]);

  const load = async () => {
    let q = supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("approved", false);
    else if (filter === "approved") q = q.eq("approved", true);
    const { data, error } = await q;
    if (error) { toast.error(error.message); return; }
    setItems((data ?? []) as Review[]);
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filter]);

  const approve = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.from("reviews").update({ approved: true }).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Review approved");
    load();
  };
  const reject = async (id: string) => {
    if (!confirm("Reject and delete this review?")) return;
    setBusyId(id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Review deleted");
    load();
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-md py-20 text-center">
        <h1 className="text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have permission to moderate reviews.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl pt-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Review moderation</h1>
            <p className="mt-1 text-sm text-muted-foreground">Approve, reject, or remove user-submitted reviews.</p>
          </div>
          <div className="flex gap-1 rounded-xl border bg-card p-1 text-xs">
            {(["pending", "approved", "all"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={
                  "rounded-lg px-3 py-1.5 font-semibold capitalize transition " +
                  (filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 pb-20">
          {items === null && <Loader2 className="mx-auto mt-12 h-5 w-5 animate-spin text-primary" />}
          {items?.length === 0 && (
            <div className="surface-card p-10 text-center text-sm text-muted-foreground">
              No reviews in this view.
            </div>
          )}
          {items?.map((r) => (
            <article key={r.id} className="surface-card p-4">
              <div className="flex items-start gap-3">
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt={r.name} className="h-10 w-10 rounded-full border object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border bg-secondary text-muted-foreground">
                    <UserIcon className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold">{r.name}</h3>
                    {r.role && <span className="text-xs text-muted-foreground">· {r.role}</span>}
                    {r.approved ? (
                      <Badge className="h-5 bg-emerald-500/15 text-[10px] text-emerald-500 hover:bg-emerald-500/15">Approved</Badge>
                    ) : (
                      <Badge variant="secondary" className="h-5 text-[10px]">Pending</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={"h-3 w-3 " + (i < r.rating ? "fill-current" : "opacity-30")} />
                    ))}
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {r.review_text}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                {!r.approved && (
                  <Button
                    size="sm"
                    onClick={() => approve(r.id)}
                    disabled={busyId === r.id}
                    className="gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reject(r.id)}
                  disabled={busyId === r.id}
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  {r.approved ? <><Trash2 className="h-4 w-4" /> Delete</> : <><X className="h-4 w-4" /> Reject</>}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
