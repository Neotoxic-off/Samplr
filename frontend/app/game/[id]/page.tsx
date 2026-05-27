"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { api } from "@/lib/api";
import type { GameRound, Playlist } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GameBoard } from "@/components/game-board";

type Difficulty = 0 | 1 | 2 | 3 | 4;
type Settings = { rounds: number; difficulty: Difficulty };

const DIFFICULTY_PRESETS: { label: string; sampleCount: number; sampleLengthSec: number; hue: number }[] = [
  { label: "Casual", sampleCount: 5, sampleLengthSec: 5, hue: 145 },
  { label: "Chill", sampleCount: 4, sampleLengthSec: 4, hue: 200 },
  { label: "Normal", sampleCount: 3, sampleLengthSec: 3, hue: 280 },
  { label: "Sharp", sampleCount: 2, sampleLengthSec: 2, hue: 330 },
  { label: "Brutal", sampleCount: 1, sampleLengthSec: 1, hue: 25 },
];

const DEFAULT_SETTINGS: Settings = { rounds: 20, difficulty: 2 };

function difficultyParams(d: Difficulty) {
  return DIFFICULTY_PRESETS[d];
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [round, setRound] = useState<GameRound | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.playlist(id).then(setPlaylist).catch((e) => setError(e instanceof Error ? e.message : "Failed to load playlist"));
  }, [id]);

  const start = async () => {
    setStarting(true);
    setError(null);
    setRound(null);
    try {
      const preset = difficultyParams(settings.difficulty);
      const r = await api.startGame(id, {
        rounds: settings.rounds,
        sampleCount: preset.sampleCount,
        sampleLengthSec: preset.sampleLengthSec,
      });
      setRound(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start game");
    } finally {
      setStarting(false);
    }
  };

  const backToSettings = () => {
    setRound(null);
    setError(null);
  };

  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
        {round ? (
          <button onClick={backToSettings} className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Settings
          </button>
        ) : (
          <Link href="/playlists" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Playlists
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-tight sm:text-base">samplr</span>
        </Link>
      </nav>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-8">
        {starting ? (
          <LoadingRound />
        ) : round ? (
          <GameBoard
            round={round}
            onRestart={start}
            key={round.playlistId + "-" + round.tracks.map((t) => t.id).join(",")}
          />
        ) : (
          <SettingsScreen
            playlist={playlist}
            settings={settings}
            onChange={setSettings}
            onStart={start}
            error={error}
          />
        )}
      </section>
    </main>
  );
}

function LoadingRound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-[var(--color-primary)]" />
      <p className="text-sm uppercase tracking-widest text-[var(--color-muted-foreground)]">Loading round…</p>
    </div>
  );
}

function SettingsScreen({
  playlist,
  settings,
  onChange,
  onStart,
  error,
}: {
  playlist: Playlist | null;
  settings: Settings;
  onChange: (s: Settings) => void;
  onStart: () => void;
  error: string | null;
}) {
  if (!playlist) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  const cover = playlist.images?.[0]?.url ?? null;
  const preset = difficultyParams(settings.difficulty);
  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        {cover ? (
          <Image
            src={cover}
            alt={playlist.name}
            width={120}
            height={120}
            className="h-24 w-24 rounded-md border border-[var(--color-border)] object-cover"
            unoptimized
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Playlist
          </p>
          <h1 className="truncate text-2xl font-semibold sm:text-3xl">{playlist.name}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {playlist.owner?.display_name ?? "Unknown"} · {playlist.items?.total ?? 0} tracks
          </p>
        </div>
      </Card>

      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-base font-semibold">Game settings</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Tune your run before launching.
          </p>
        </div>

        <SliderField
          label="Rounds"
          value={settings.rounds}
          min={5}
          max={100}
          step={1}
          onChange={(v) => onChange({ ...settings, rounds: v })}
        />

        <DifficultySlider
          value={settings.difficulty}
          onChange={(d) => onChange({ ...settings, difficulty: d })}
          preset={preset}
        />

        {error ? <p className="text-sm text-[var(--color-destructive)]">{error}</p> : null}

        <Button onClick={onStart} size="default" className="w-full sm:w-auto">
          <Play className="h-4 w-4" /> Start game
        </Button>
      </Card>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-[var(--color-muted-foreground)]">{label}</span>
        <span className="font-mono tabular-nums">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-muted)]"
      />
      <span className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </span>
    </label>
  );
}

function DifficultySlider({
  value,
  onChange,
  preset,
}: {
  value: number;
  onChange: (v: 0 | 1 | 2 | 3 | 4) => void;
  preset: { label: string; sampleCount: number; sampleLengthSec: number; hue: number };
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-[var(--color-muted-foreground)]">Difficulty</span>
        <span className="font-mono" style={{ color: `oklch(0.7 0.18 ${preset.hue})` }}>
          {preset.label}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={4}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as 0 | 1 | 2 | 3 | 4)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(90deg, oklch(0.55 0.16 145), oklch(0.55 0.16 200), oklch(0.55 0.16 280), oklch(0.6 0.18 330), oklch(0.6 0.2 25))`,
        }}
      />
      <div className="grid grid-cols-5 gap-1 text-xs">
        {DIFFICULTY_PRESETS.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i as 0 | 1 | 2 | 3 | 4)}
            className={`truncate rounded-md border px-2 py-1 transition-colors ${
              i === value
                ? "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-foreground)]"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm">
        <span className="text-[var(--color-muted-foreground)]">
          {preset.sampleCount} sample{preset.sampleCount === 1 ? "" : "s"} × {preset.sampleLengthSec}s
        </span>
        <span className="font-mono text-xs tabular-nums text-[var(--color-muted-foreground)]">
          {(preset.sampleCount * preset.sampleLengthSec).toFixed(1)}s audio
        </span>
      </div>
    </div>
  );
}
