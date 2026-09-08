import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function KricsMark({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={cn(size === "sm" ? "h-8 w-8" : "h-9 w-9", "shrink-0", className)}
      aria-hidden="true"
    >
      <rect x="3" y="18" width="8" height="15" rx="1.5" fill="#e8c547" />
      <rect x="14" y="10" width="8" height="23" rx="1.5" fill="#d7e4e2" />
      <rect x="25" y="3" width="8" height="30" rx="1.5" fill="#ffffff" />
    </svg>
  );
}

export function KricsLogo({
  className,
  wordmark = false,
  light = false,
  size = "md",
}: {
  className?: string;
  wordmark?: boolean;
  light?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <KricsMark size={size} />
      {wordmark && (
        <span
          className={cn(
            "font-bold tracking-wide leading-none",
            size === "sm" ? "text-[17px]" : "text-[22px]",
            light ? "text-white" : "text-foreground",
          )}
        >
          KRICS
        </span>
      )}
      <span className="sr-only">{APP_NAME}</span>
    </div>
  );
}
