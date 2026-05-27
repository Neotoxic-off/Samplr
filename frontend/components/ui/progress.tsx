import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  className,
}: { value?: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-muted)]",
        className,
      )}
    >
      <div
        className="h-full bg-[var(--color-primary)] transition-[width] duration-150"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
