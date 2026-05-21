import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Apple, ArrowLeft, CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";

type AuthMode = "signin" | "signup";
type OAuthProvider = "google" | "apple";
type ProviderCheck = {
  checking: boolean;
  enabled: boolean | null;
  message?: string;
};

const LAST_EMAIL_KEY = "qrforge.lastAccountEmail";
const SUPABASE_AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const providerLabels: Record<OAuthProvider, string> = {
  google: "Google",
  apple: "Apple",
};

const defaultProviderChecks: Record<OAuthProvider, ProviderCheck> = {
  google: { checking: true, enabled: null },
  apple: { checking: true, enabled: null },
};

function oauthSetupMessage(provider: OAuthProvider, rawMessage?: string) {
  const label = providerLabels[provider];
  const message = rawMessage?.toLowerCase() ?? "";

  if (message.includes("missing oauth secret")) {
    return `${label} sign-in is enabled but missing its OAuth client secret. Open Backend → Users → Authentication Settings → Sign In Methods → ${label}, then add the Client ID and Client Secret or enable the managed provider.`;
  }

  if (message.includes("unsupported provider")) {
    return `${label} sign-in is not fully enabled. Open Backend → Users → Authentication Settings → Sign In Methods → ${label}, enable it, and save the provider credentials.`;
  }

  return `${label} sign-in could not be verified. Open Backend → Users → Authentication Settings → Sign In Methods and confirm the provider is enabled with a valid Client ID and Client Secret.`;
}

async function verifyOAuthProvider(provider: OAuthProvider, redirectTo: string): Promise<ProviderCheck> {
  if (!SUPABASE_AUTH_URL || !SUPABASE_ANON_KEY) {
    return {
      checking: false,
      enabled: false,
      message: "Supabase environment variables are missing. Reconnect the backend before using social sign-in.",
    };
  }

  try {
    const settingsResponse = await fetch(`${SUPABASE_AUTH_URL}/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    const settings = await settingsResponse.json().catch(() => null) as { external?: Record<string, boolean> } | null;
    if (settings?.external?.[provider] === false) {
      return { checking: false, enabled: false, message: oauthSetupMessage(provider, "unsupported provider") };
    }

    const authorizeUrl = new URL(`${SUPABASE_AUTH_URL}/authorize`);
    authorizeUrl.searchParams.set("provider", provider);
    authorizeUrl.searchParams.set("redirect_to", `${window.location.origin}${redirectTo}`);

    const response = await fetch(authorizeUrl.toString(), {
      headers: { apikey: SUPABASE_ANON_KEY },
      redirect: "manual",
    });

    if (response.status === 400) {
      const payload = await response.json().catch(() => null) as { msg?: string; error?: string; error_code?: string } | null;
      const rawMessage = payload?.msg || payload?.error || payload?.error_code;
      return { checking: false, enabled: false, message: oauthSetupMessage(provider, rawMessage) };
    }

    return { checking: false, enabled: true };
  } catch {
    return { checking: false, enabled: null, message: `Couldn't verify ${providerLabels[provider]} sign-in setup. Try again, or check the provider settings in Backend → Users → Authentication Settings.` };
  }
}

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
  const [providerChecks, setProviderChecks] = useState<Record<OAuthProvider, ProviderCheck>>(defaultProviderChecks);
  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/dashboard";

  const refreshOAuthChecks = useCallback(async () => {
    setProviderChecks(defaultProviderChecks);
    const [google, apple] = await Promise.all([
      verifyOAuthProvider("google", redirectTo),
      verifyOAuthProvider("apple", redirectTo),
    ]);
    setProviderChecks({ google, apple });
  }, [redirectTo]);

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

  useEffect(() => {
    void refreshOAuthChecks();
  }, [refreshOAuthChecks]);

  const handleOAuth = async (provider: OAuthProvider) => {
    const existingCheck = providerChecks[provider];
    if (existingCheck.enabled === false) {
      toast.error(`${providerLabels[provider]} sign-in needs setup`, { description: existingCheck.message });
      return;
    }

    setBusy(true);
    const latestCheck = await verifyOAuthProvider(provider, redirectTo);
    setProviderChecks((current) => ({ ...current, [provider]: latestCheck }));
    if (latestCheck.enabled === false) {
      setBusy(false);
      toast.error(`${providerLabels[provider]} sign-in needs setup`, { description: latestCheck.message });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
        queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
      },
    });
    if (error) {
      const message = oauthSetupMessage(provider, error.message);
      toast.error(`${providerLabels[provider]} sign-in failed`, { description: message });
      setProviderChecks((current) => ({
        ...current,
        [provider]: { checking: false, enabled: false, message },
      }));
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
    if (!name.trim()) {
      return toast.error("Please enter your name.");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }
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
    // If email confirmation is required, no session is returned. Try signing in directly.
    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInErr) {
        setBusy(false);
        toast.success("Account created! Please check your email to confirm your address before signing in.");
        setMode("signin");
        return;
      }
    }
    // Safety-net: ensure a profile row exists even if the DB trigger ever fails silently.
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

          <OAuthSetupCheck checks={providerChecks} onRefresh={refreshOAuthChecks} />

          <div className="mt-6 grid gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={busy || providerChecks.google.enabled === false}
              className="h-11"
            >
              <GoogleIcon className="mr-2 h-4 w-4" /> Continue with Google
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={busy || providerChecks.apple.enabled === false}
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
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="signin">Sign in</TabsTrigger>
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
                    required
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

function OAuthSetupCheck({
  checks,
  onRefresh,
}: {
  checks: Record<OAuthProvider, ProviderCheck>;
  onRefresh: () => void;
}) {
  const failedProviders = (Object.keys(checks) as OAuthProvider[]).filter((provider) => checks[provider].enabled === false);
  const checking = (Object.keys(checks) as OAuthProvider[]).some((provider) => checks[provider].checking);

  if (checking) {
    return (
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking Google and Apple OAuth setup…
      </div>
    );
  }

  if (failedProviders.length === 0) {
    return (
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Google and Apple OAuth providers are enabled.
      </div>
    );
  }

  return (
    <Alert variant="destructive" className="mt-5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>OAuth provider setup needs attention</AlertTitle>
      <AlertDescription className="space-y-3">
        <ul className="list-disc space-y-2 pl-4">
          {failedProviders.map((provider) => (
            <li key={provider}>{checks[provider].message}</li>
          ))}
        </ul>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh} className="h-8">
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Recheck setup
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1-.1-1.5H12z"/>
    </svg>
  );
}