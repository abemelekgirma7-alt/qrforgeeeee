import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";

type AuthMode = "signin" | "signup";

const LAST_EMAIL_KEY = "qrforge.lastAccountEmail";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/dashboard";

  useEffect(() => {
    try {
      const v = localStorage.getItem(LAST_EMAIL_KEY);
      if (v) setLastEmail(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) navigate(redirectTo, { replace: true });
  }, [user, authLoading, navigate, redirectTo]);

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${redirectTo}`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        toast.error("Google sign-in failed", { description: result.error.message || "Please try again." });
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error("Google sign-in failed", { description: err instanceof Error ? err.message : "Unknown error" });
      setBusy(false);
    }
  };

  const rememberEmail = (value: string) => {
    try {
      if (value) localStorage.setItem(LAST_EMAIL_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
        return toast.error("Wrong email or password. If this is a new account, create it with Sign up first.");
      }
      if (msg.includes("email not confirmed")) {
        return toast.error("Please confirm your email address before signing in — check your inbox.");
      }
      return toast.error(error.message);
    }
    rememberEmail(email);
    toast.success("Welcome back!");
    navigate(redirectTo, { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter your name.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
        data: { full_name: name.trim(), name: name.trim() },
      },
    });
    if (error) {
      setBusy(false);
      const message = error.message.toLowerCase();
      if (message.includes("already registered") || message.includes("already been registered") || message.includes("user already registered") || message.includes("already exists")) {
        setMode("signin");
        rememberEmail(email);
        return toast.error("That email already has an account. Please sign in instead.");
      }
      if (message.includes("invalid email")) return toast.error("Enter a valid email address.");
      if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("6"))) {
        return toast.error("Password is too weak. Use at least 6 characters with a mix of letters and numbers.");
      }
      if (message.includes("network") || message.includes("fetch")) {
        return toast.error("Network error. Check your connection and try again.");
      }
      return toast.error(error.message);
    }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setBusy(false);
      setMode("signin");
      rememberEmail(email);
      return toast.error("That email already has an account. Please sign in instead.");
    }
    rememberEmail(email);
    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInErr) {
        setBusy(false);
        toast.success("Account created! Please check your email to confirm your address before signing in.");
        setMode("signin");
        return;
      }
    }
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (uid) {
        await supabase.from("profiles").upsert(
          { id: uid, display_name: name.trim() },
          { onConflict: "id", ignoreDuplicates: true },
        );
      }
    } catch (err) {
      console.error("[Auth] profile upsert fallback failed", err);
    }
    setBusy(false);
    toast.success(`Welcome, ${name.split(" ")[0] || "there"}!`);
    navigate(redirectTo, { replace: true });
  };

  const useLastAccount = () => {
    if (!lastEmail) return;
    setEmail(lastEmail);
    setMode("signin");
  };

  if (authLoading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container pt-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>

      <div className="container flex items-center justify-center py-12">
        <div className="w-full max-w-md surface-card p-7">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to QR Forge</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create an account to save your QR codes and access your dashboard.
            </p>
          </div>

          {lastEmail && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold uppercase text-primary">
                {lastEmail[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Welcome back — last signed in as</p>
                <p className="truncate text-sm font-medium">{lastEmail}</p>
              </div>
              <button
                type="button"
                onClick={useLastAccount}
                className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Use this
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-2">
            <Button variant="outline" type="button" onClick={handleGoogle} disabled={busy} className="h-11">
              <GoogleIcon className="mr-2 h-4 w-4" /> Continue with Google
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            OR
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="signin">Sign in</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-4 grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="si-pw">Password</Label>
                  <Input id="si-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="mt-2 h-11">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="mr-2 h-4 w-4" /> Sign in</>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="su-name">Name</Label>
                  <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="su-pw">Password</Label>
                  <Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="mt-2 h-11">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.5 2.2 2.1 6.6 2.1 12.1S6.5 22 12 22c6.9 0 9.5-4.8 9.5-7.3 0-.5 0-.9-.1-1.3H12z" />
    </svg>
  );
}
