import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "success" | "destructive" | "outline";

const variantClass: Record<Variant, string> = {
  default: "border-[color-mix(in_oklch,var(--color-primary)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-primary)_25%,transparent)] text-[var(--color-primary)]",
  secondary: "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-foreground)]",
  success: "border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_25%,transparent)] text-[#3fb950]",
  destructive: "border-[color-mix(in_oklch,var(--color-destructive)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-destructive)_20%,transparent)] text-[#f85149]",
  outline: "border-[var(--color-border)] text-[var(--color-foreground)]",
};

export function Badge({
  className,
  variant = "default",
  ...p
}: React.HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClass[variant],
        className,
      )}
      {...p}
    />
  );
}
