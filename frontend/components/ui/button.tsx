import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "border-[color-mix(in_oklch,var(--color-primary)_50%,transparent)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[color-mix(in_oklch,var(--color-primary),black_10%)]",
        secondary:
          "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[color-mix(in_oklch,var(--color-muted),white_3%)]",
        ghost:
          "border-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
        outline:
          "border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
        destructive:
          "border-[color-mix(in_oklch,var(--color-destructive)_50%,transparent)] bg-[var(--color-destructive)] text-white hover:bg-[color-mix(in_oklch,var(--color-destructive),black_10%)]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
