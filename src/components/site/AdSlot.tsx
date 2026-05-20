import { cn } from "@/lib/utils";

/**
 * Empty placeholder ad container — actual ads are added later via Google AdSense.
 * Renders a subtle responsive empty area that blends into the layout.
 */
export function AdSlot({
  size = "leaderboard",
  className,
}: {
  size?: "leaderboard" | "rectangle" | "skyscraper" | "vertical";
  className?: string;
  label?: string;
}) {
  const dims =
    size === "leaderboard"
      ? "w-full max-w-[728px] h-[90px]"
      : size === "rectangle"
        ? "w-[300px] h-[250px]"
        : size === "vertical"
          ? "w-full min-h-[600px] max-w-[260px]"
          : "w-[160px] h-[600px]";
  return (
    <div className={cn("flex w-full items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-2xl border border-dashed border-white/10 bg-white/[0.02]",
          dims,
        )}
        data-ad-slot={size}
        aria-hidden="true"
      />
    </div>
  );
}
