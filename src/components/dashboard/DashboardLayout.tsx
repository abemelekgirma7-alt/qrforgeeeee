import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  CreditCard,
  FolderOpen,
  Key,
  LayoutDashboard,
  Layers,
  LogOut,
  Settings,
  Shield,
  User as UserIcon,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/templates", label: "Templates", icon: Layers },
  { to: "/bulk", label: "Bulk jobs", icon: Briefcase },
  { to: "/files", label: "File manager", icon: FolderOpen },
  { to: "/team", label: "Team", icon: Users },
  { to: "/api", label: "API keys", icon: Key },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

export function DashboardLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  return (
    <div className="min-h-screen">
      <header className="container flex flex-wrap items-center justify-between gap-3 pt-6 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Home
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Account">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserIcon className="h-3.5 w-3.5" /> Account
              </DropdownMenuLabel>
              <DropdownMenuItem disabled className="text-xs">{user?.email}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => { await signOut(); navigate("/", { replace: true }); }}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section className="container mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="surface-card h-fit p-3 lg:sticky lg:top-6">
          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                    isActive
                      ? "bg-destructive/10 text-destructive font-semibold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )
                }
              >
                <Shield className="h-4 w-4" /> Admin
              </NavLink>
            )}
          </nav>
        </aside>

        <main>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </section>
    </div>
  );
}