"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Sample } from "@/lib/types";

type Props = {
  seed: string;
  duration: number;
  samples: Sample[];
  currentTime: number;
  activeSample: number | null;
  playing: boolean;
};

const BARS = 240;

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildHeights(seed: string): number[] {
  const rnd = mulberry32(hashStr(seed));
  const out: number[] = [];
  let env = 0.4;
  for (let i = 0; i < BARS; i++) {
    const r = rnd();
    env += (r - 0.5) * 0.18;
    env = Math.max(0.08, Math.min(1, env));
    const layered = env * (0.7 + 0.3 * Math.sin(i / 9 + r * 3));
    const spike = r > 0.94 ? r * 0.5 : 0;
    out.push(Math.max(0.05, Math.min(1, layered + spike)));
  }
  return out;
}

export function Waveform({ seed, duration, samples, currentTime, activeSample, playing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const heights = useMemo(() => buildHeights(seed), [seed]);

  useEffect(() => {
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
      c.clearRect(0, 0, w, h);

      const gap = 1 * dpr;
      const barW = (w - gap * (BARS - 1)) / BARS;
      const now = performance.now() / 600;
      const playheadX = duration > 0 ? (currentTime / duration) * w : 0;

      for (let i = 0; i < BARS; i++) {
        const tSec = (i / BARS) * duration;
        let sampleIdx = -1;
        for (let s = 0; s < samples.length; s++) {
          const smp = samples[s];
          if (tSec >= smp.startSec && tSec < smp.startSec + smp.lengthSec) {
            sampleIdx = s;
            break;
          }
        }

        const passed = (i / BARS) * w < playheadX;
        const baseH = heights[i];
        const isActive = sampleIdx >= 0 && sampleIdx === activeSample;
        const pulse = playing && isActive ? 1 + 0.18 * Math.sin(now * 3 + i * 0.3) : 1;
        const bh = Math.max(2 * dpr, baseH * h * 0.9 * pulse);
        const x = i * (barW + gap);
        const y = (h - bh) / 2;

        let fill: string;
        if (sampleIdx >= 0) {
          const hue = (sampleIdx * 360) / Math.max(samples.length, 1);
          const lum = isActive ? 0.7 : 0.55;
          const alpha = isActive ? 1 : 0.85;
          fill = `oklch(${lum} 0.18 ${hue} / ${alpha})`;
        } else {
          fill = passed
            ? `oklch(0.65 0.005 240 / 0.7)`
            : `oklch(0.4 0.005 240 / 0.45)`;
        }
        c.fillStyle = fill;
        c.fillRect(x, y, barW, bh);
      }

      c.fillStyle = "rgba(255,255,255,0.85)";
      c.fillRect(playheadX - dpr / 2, 0, dpr, h);
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [heights, samples, duration, currentTime, activeSample, playing]);

  return (
    <canvas
      ref={canvasRef}
      className="h-40 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 sm:h-48 md:h-56"
    />
  );
}
