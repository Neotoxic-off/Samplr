"use client";

import type { Sample } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  duration: number;
  samples: Sample[];
  currentTime: number;
  activeSample: number | null;
};

export function SampleTimeline({ duration, samples, currentTime, activeSample }: Props) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / duration) * 100))}%`;
  return (
    <div className="relative h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40">
      {samples.map((s, i) => {
        const hue = (i * 360) / Math.max(samples.length, 1);
        const active = i === activeSample;
        return (
          <div
            key={i}
            className={cn(
              "absolute top-0 h-full rounded-md border transition-all",
              active && "ring-2 ring-white/70",
            )}
            style={{
              left: pct(s.startSec),
              width: pct(s.lengthSec),
              backgroundColor: `oklch(0.6 0.2 ${hue} / ${active ? 0.55 : 0.25})`,
              borderColor: `oklch(0.65 0.22 ${hue})`,
            }}
          >
            <span className="absolute -top-5 left-1 text-[10px] font-mono text-[var(--color-muted-foreground)]">
              #{i + 1}
            </span>
          </div>
        );
      })}
      <div
        className="absolute top-0 h-full w-0.5 bg-white/80"
        style={{ left: pct(currentTime) }}
      />
      <div className="absolute bottom-0 left-2 right-2 flex justify-between text-[10px] font-mono text-[var(--color-muted-foreground)] pointer-events-none">
        <span>0s</span>
        <span>{Math.round(duration)}s</span>
      </div>
    </div>
  );
}
