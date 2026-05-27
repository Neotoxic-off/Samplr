"use client";

import { useEffect, useRef } from "react";

type Props = {
  active: boolean;
  hue?: number;
};

export function Visualizer({ active, hue = 145 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: 64 }, () => Math.random() * 0.3);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const now = performance.now() / 1000;
      const bars = barsRef.current;
      const n = bars.length;
      for (let i = 0; i < n; i++) {
        const f = i / n;
        const target = active
          ? 0.25 +
            0.55 *
              Math.abs(
                Math.sin(now * (1.5 + f * 3) + i * 0.6) *
                  Math.cos(now * (0.7 + f * 1.4) + i * 0.2),
              ) *
              (1 - f * 0.4)
          : 0.05 + 0.05 * Math.sin(now * 0.6 + i * 0.3);
        bars[i] += (target - bars[i]) * 0.25;
      }

      c.clearRect(0, 0, w, h);
      const gap = 2 * dpr;
      const barW = (w - gap * (n - 1)) / n;
      for (let i = 0; i < n; i++) {
        const v = bars[i];
        const bh = Math.max(2 * dpr, v * h);
        const x = i * (barW + gap);
        const y = (h - bh) / 2;
        const localHue = hue - (i / n) * 80;
        c.fillStyle = `oklch(${0.55 + v * 0.25} ${0.18 + v * 0.04} ${localHue})`;
        c.fillRect(x, y, barW, bh);
      }
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, hue]);

  return (
    <canvas
      ref={canvasRef}
      className="h-32 w-full rounded-lg bg-[var(--color-muted)]/30"
    />
  );
}
