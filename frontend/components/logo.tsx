import type { SVGProps } from "react";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <line x1="14.5" y1="2" x2="14.5" y2="22" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 2" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 12h2" />
        <path d="M6 8v8" />
        <path d="M10 4v16" />
        <path d="M14 7v10" />
        <path d="M18 10v4" />
        <path d="M22 12h-2" />
      </g>
      <circle cx="14.5" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-card)] ${className ?? ""}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          background: "radial-gradient(circle at 60% 50%, var(--color-primary), transparent 65%)",
        }}
      />
      <Logo className="relative h-3/5 w-3/5 text-[var(--color-primary)]" />
    </div>
  );
}

export function LogoFull({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark className="h-8 w-8" />
      <span className="text-base font-semibold tracking-tight">
        sampl<span className="text-[var(--color-primary)]">r</span>
      </span>
    </div>
  );
}
