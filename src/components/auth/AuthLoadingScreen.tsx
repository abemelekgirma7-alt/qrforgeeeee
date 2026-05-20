import { Loader2, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthLoadingScreen({ message = "Restoring your session…" }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-md surface-card p-7">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-6 w-6" />
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {message}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Checking your saved login before showing account options.</p>
          </div>

          <div className="mt-6 space-y-3" aria-hidden="true">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <div className="flex items-center gap-3 py-2">
              <Skeleton className="h-px flex-1" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-px flex-1" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}