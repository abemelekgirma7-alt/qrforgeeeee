import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Apple, ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

type AuthMode = "signin" | "signup";

const LAST_EMAIL_KEY = "qrforge.lastAccountEmail";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [lastEmail, setLastEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LAST_EMAIL_KEY);
      if (v) setLastEmail(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const handleOAuth = async (provider: "google" | "apple") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      toast.error(`Couldn't sign in with ${provider}`);
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate("/dashboard", { replace: true });
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    rememberEmail(email);
    toast.success("Welcome back!");
    navigate("/dashboard", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("Please enter your name.");
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name },
      },
    });
    if (error) {
      setBusy(false);
      const message = error.message.toLowerCase();
      if (message.includes("already registered") || message.includes("already been registered") || message.includes("user already registered")) {
        setMode("signin");
        rememberEmail(email);
        return toast.error("You already have an account. Please sign in instead.");
      }
      return toast.error(error.message);
    }
    rememberEmail(email);
    // If email confirmation is required, no session is returned. Try signing
    // in directly — works whenever confirmation is disabled at the project
    // level and gives a clear message otherwise.
    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (signInErr) {
        toast.success("Account created! Please check your email to confirm your address before signing in.");
        setMode("signin");
        return;
      }
    } else {
      setBusy(false);
    }
    toast.success(`Welcome, ${name.split(" ")[0] || "there"}!`);
    navigate("/dashboard", { replace: true });
  };

  const useLastAccount = () => {
    if (!lastEmail) return;
    setEmail(lastEmail);
    setMode("signin");
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>

      <div className="container flex items-center justify-center py-12">
        <div className="w-full max-w-md surface-card p-7">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to QR Forge</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to save your QR codes and access your dashboard.
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
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={busy}
              className="h-11"
            >
              <GoogleIcon className="mr-2 h-4 w-4" /> Continue with Google
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={busy}
              className="h-11"
            >
              <Apple className="mr-2 h-4 w-4" /> Continue with Apple
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            OR
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-4 grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input
                    id="si-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="si-pw">Password</Label>
                  <Input
                    id="si-pw"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
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
                  <Input
                    id="su-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input
                    id="su-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="su-pw">Password</Label>
                  <Input
                    id="su-pw"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
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

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1-.1-1.5H12z"/>
    </svg>
  );
}