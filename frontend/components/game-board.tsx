"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type React from "react";
import {
  Check,
  ChevronRight,
  Clock,
  HelpCircle,
  ListMusic,
  Music,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { GameRound, GameTrack } from "@/lib/types";
import { formatTime, matches } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Waveform } from "@/components/waveform";
import { useSpotifyPlayer } from "@/lib/spotify-player";

type RoundResult = {
  correct: boolean;
  skipped: boolean;
  guess: string;
  trackTitle: string;
  trackArtist: string;
  trackCover: string | null;
  responseMs: number;
};

export function GameBoard({ round, onRestart }: { round: GameRound; onRestart: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [guess, setGuess] = useState("");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSample, setActiveSample] = useState<number | null>(null);

  const player = useSpotifyPlayer();
  const playerRef = useRef(player);
  playerRef.current = player;

  type Playback = {
    uri: string;
    samples: { startSec: number; lengthSec: number }[];
    sampleIdx: number;
    startMs: number;
    endMs: number;
    issuedAt: number;
    started: boolean;
    retried: boolean;
  };

  const queueRef = useRef<number[]>([]);
  const currentUriRef = useRef<string | null>(null);
  const playbackRef = useRef<Playback | null>(null);
  const tickRef = useRef<number | null>(null);
  const roundStartRef = useRef<number>(performance.now());

  const track: GameTrack | undefined = round.tracks[index];
  const done = index >= round.tracks.length;

  const issuePlay = useCallback(async (uri: string, startMs: number) => {
    currentUriRef.current = uri;
    await playerRef.current.playTrack(uri, startMs);
  }, []);

  const startSample = useCallback(async (uri: string, sampleIndex: number, samples: { startSec: number; lengthSec: number }[]) => {
    const s = samples[sampleIndex];
    if (!s) return;
    console.debug("[sample] start idx=", sampleIndex, "startSec=", s.startSec, "lengthSec=", s.lengthSec);
    setActiveSample(sampleIndex);
    setPlaying(true);
    const startMs = Math.floor(s.startSec * 1000);
    const endMs = startMs + Math.floor(s.lengthSec * 1000);
    playbackRef.current = {
      uri,
      samples,
      sampleIdx: sampleIndex,
      startMs,
      endMs,
      issuedAt: performance.now(),
      started: false,
      retried: false,
    };
    await issuePlay(uri, startMs);
  }, [issuePlay]);

  const advance = useCallback(async () => {
    const next = queueRef.current.shift();
    const pb = playbackRef.current;
    if (next !== undefined && pb) {
      await startSample(pb.uri, next, pb.samples);
    } else {
      playbackRef.current = null;
      setActiveSample(null);
      setPlaying(false);
      window.setTimeout(() => {
        playerRef.current.pause().catch(() => {});
      }, 250);
    }
  }, [startSample]);

  const stopAll = useCallback(async () => {
    playbackRef.current = null;
    queueRef.current = [];
    currentUriRef.current = null;
    setActiveSample(null);
    setPlaying(false);
    await playerRef.current.pause().catch(() => {});
  }, []);

  useEffect(() => {
    setRevealed(false);
    setGuess("");
    setCurrentTime(0);
    roundStartRef.current = performance.now();
    stopAll();
  }, [index, stopAll]);

  useEffect(() => {
    if (!playing) {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = window.setInterval(async () => {
      const state = await playerRef.current.getState();
      if (state) setCurrentTime(state.position / 1000);
      const pb = playbackRef.current;
      if (!pb || !state) return;
      const elapsed = performance.now() - pb.issuedAt;
      const currentTrackUri = state.track_window.current_track.uri;
      const linkedFromUri = state.track_window.current_track.linked_from?.uri;
      const trackMatch = currentTrackUri === pb.uri || linkedFromUri === pb.uri;
      if (!state.paused && trackMatch) {
        pb.started = true;
        if (state.position >= pb.endMs) {
          console.debug("[tick] sample end reached", pb.sampleIdx, "pos=", state.position, "endMs=", pb.endMs);
          advance();
        }
      } else if (!trackMatch && elapsed > 800 && !pb.retried) {
        console.debug("[tick] uri mismatch, re-issue", "expected", pb.uri, "got", currentTrackUri);
        pb.retried = true;
        pb.issuedAt = performance.now();
        await issuePlay(pb.uri, pb.startMs);
      } else if (!pb.started && elapsed > 1500 && !pb.retried) {
        console.debug("[tick] retry sample", pb.sampleIdx);
        pb.retried = true;
        pb.issuedAt = performance.now();
        await issuePlay(pb.uri, pb.startMs);
      } else if (pb.started && state.paused) {
        playerRef.current.resume().catch(() => {});
      }
    }, 150);
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, [playing, advance, issuePlay]);

  const playAll = useCallback(async () => {
    if (!track) return;
    if (playing) {
      await stopAll();
      return;
    }
    const order = track.samples
      .map((_, i) => i)
      .sort((a, b) => track.samples[a].startSec - track.samples[b].startSec);
    queueRef.current = order.slice(1);
    await startSample(track.uri, order[0], track.samples);
  }, [playing, startSample, stopAll, track]);

  const submit = useCallback(() => {
    if (!track) return;
    const correct = matches(guess, track.artist) || matches(guess, track.title);
    const responseMs = performance.now() - roundStartRef.current;
    setResults((prev) => [
      ...prev,
      {
        correct,
        skipped: false,
        guess,
        trackTitle: track.title,
        trackArtist: track.artist,
        trackCover: track.coverUrl,
        responseMs,
      },
    ]);
    setRevealed(true);
    stopAll();
  }, [guess, track, stopAll]);

  const skip = useCallback(() => {
    if (!track) return;
    const responseMs = performance.now() - roundStartRef.current;
    setResults((prev) => [
      ...prev,
      {
        correct: false,
        skipped: true,
        guess: "",
        trackTitle: track.title,
        trackArtist: track.artist,
        trackCover: track.coverUrl,
        responseMs,
      },
    ]);
    setRevealed(true);
    stopAll();
  }, [track, stopAll]);

  const next = () => setIndex((i) => i + 1);
  const restart = () => {
    setIndex(0);
    setResults([]);
    onRestart();
  };

  const score = useMemo(() => {
    const points = results.reduce((acc, r) => acc + (r.correct ? 1 : 0), 0);
    const max = results.length;
    return { points, max };
  }, [results]);

  if (done) {
    return <GameOver results={results} round={round} onRestart={restart} />;
  }

  if (!track) return null;

  const totalSampleSec = round.sampleCount * round.sampleLengthSec;
  const accuracy = results.length ? Math.round((score.points / results.length) * 100) : 0;
  const modeHue = difficultyHue(round.sampleCount);
  const themeStyle = {
    "--color-primary": `oklch(0.72 0.26 ${modeHue})`,
    "--color-ring": `oklch(0.72 0.26 ${modeHue})`,
  } as React.CSSProperties;

  return (
    <div style={themeStyle} className="space-y-5 sm:space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
            <ListMusic className="h-3.5 w-3.5" /> {round.playlistName}
          </p>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Round {index + 1}
            <span className="text-[var(--color-muted-foreground)]"> / {round.tracks.length}</span>
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ScorePill icon={<Target className="h-3.5 w-3.5" />} label="Accuracy" value={`${accuracy}%`} />
          <ScorePill icon={<Sparkles className="h-3.5 w-3.5" />} label="Score" value={`${score.points}`} highlight />
        </div>
      </header>

      <RoundDots total={round.tracks.length} index={index} results={results} />

      {!player.ready && (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          {player.error
            ? `Spotify player error: ${player.error}`
            : "Connecting Spotify player… (Premium account required)"}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
                <Music className="h-3.5 w-3.5" /> Preview
              </h3>
              <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted-foreground)] sm:text-sm">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(currentTime)} / {formatTime(track.durationSec)}
              </span>
            </div>

            <div className="relative">
              <Waveform
                seed={track.uri}
                duration={track.durationSec}
                samples={track.samples}
                currentTime={currentTime}
                activeSample={activeSample}
                playing={playing}
              />
              <button
                type="button"
                onClick={playAll}
                disabled={!player.ready}
                aria-label={playing ? "Stop samples" : "Play samples"}
                className="group absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-black/40 ring-1 ring-white/10 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-16"
              >
                {playing ? (
                  <Pause className="h-6 w-6 sm:h-7 sm:w-7" />
                ) : (
                  <Play className="h-6 w-6 translate-x-[1px] sm:h-7 sm:w-7" />
                )}
              </button>
            </div>

            <SampleChips
              samples={track.samples}
              activeSample={activeSample}
              playing={playing}
            />
          </Card>

          <Card className="space-y-4 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
              <HelpCircle className="h-3.5 w-3.5" /> Your guess
            </h3>
            {!revealed ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
              >
                <Input
                  placeholder="Artist or title…"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  autoFocus
                  className="h-10"
                />
                <Button type="submit" disabled={!guess} size="default">
                  Reveal
                </Button>
                <Button type="button" variant="outline" onClick={skip} size="default">
                  <HelpCircle className="h-4 w-4" /> No idea
                </Button>
              </form>
            ) : (
              <Reveal track={track} result={results[results.length - 1]} onNext={next} />
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4 p-5">
            <h3 className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
              <Music className="h-3.5 w-3.5" /> Round info
            </h3>
            <dl className="grid gap-3 text-sm">
              <Stat label="Samples / track" value={round.sampleCount} />
              <Stat label="Sample length" value={`${round.sampleLengthSec}s`} />
              <Stat label="Audio total" value={`${totalSampleSec.toFixed(1)}s`} />
              <Stat label="Track duration" value={formatTime(track.durationSec)} />
            </dl>
          </Card>
          <Card className="space-y-3 p-5">
            <h3 className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
              <Trophy className="h-3.5 w-3.5" /> Performance
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tabular-nums">{score.points}</span>
              <span className="text-sm text-[var(--color-muted-foreground)]">/ {results.length || round.tracks.length}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                style={{ width: `${accuracy}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {results.length === 0 ? "Awaiting first answer." : `${accuracy}% accuracy across ${results.length} round${results.length === 1 ? "" : "s"}.`}
            </p>
          </Card>
          <Card className="space-y-3 p-5">
            <h3 className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
              <Volume2 className="h-3.5 w-3.5" /> Mixer
            </h3>
            <VolumeControl volume={player.volume} onChange={player.setVolume} />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ScorePill({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
        highlight
          ? "border-[color-mix(in_oklch,var(--color-primary)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-primary)_20%,transparent)] text-[var(--color-primary)]"
          : "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
      }`}
    >
      {icon}
      <span className="hidden text-[var(--color-muted-foreground)] sm:inline">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

function RoundDots({
  total,
  index,
  results,
}: {
  total: number;
  index: number;
  results: RoundResult[];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const result = results[i];
        const current = i === index && !result;
        return (
          <div
            key={i}
            className={`h-1.5 flex-1 min-w-[8px] rounded-sm transition-colors duration-200 ${
              result?.correct
                ? "bg-[var(--color-accent)]"
                : result
                ? "bg-[var(--color-destructive)]"
                : current
                ? "animate-pulse bg-[var(--color-primary)]"
                : "bg-[var(--color-muted)]"
            }`}
            title={`Round ${i + 1}${result ? (result.correct ? " · Correct" : " · Missed") : ""}`}
          />
        );
      })}
    </div>
  );
}

function SampleChips({
  samples,
  activeSample,
  playing,
}: {
  samples: { startSec: number; lengthSec: number }[];
  activeSample: number | null;
  playing: boolean;
}) {
  const playedIdx = activeSample ?? -1;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">Samples</span>
      {samples.map((s, i) => {
        const hue = (i * 360) / Math.max(samples.length, 1);
        const active = i === activeSample && playing;
        const past = playedIdx > i;
        return (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              borderColor: `oklch(0.55 0.18 ${hue} / ${active ? 1 : 0.5})`,
              backgroundColor: `oklch(0.55 0.18 ${hue} / ${active ? 0.3 : past ? 0.12 : 0.06})`,
              color: `oklch(${active ? 0.85 : 0.72} 0.18 ${hue})`,
            }}
          >
            <span>#{i + 1}</span>
            <span className="text-[10px] opacity-70">{s.lengthSec.toFixed(1)}s</span>
            {past ? <Check className="h-3 w-3" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function GameOver({
  results,
  round,
  onRestart,
}: {
  results: RoundResult[];
  round: GameRound;
  onRestart: () => void;
}) {
  const correct = results.filter((r) => r.correct).length;
  const skipped = results.filter((r) => r.skipped).length;
  const missed = results.length - correct - skipped;
  const accuracy = results.length ? Math.round((correct / results.length) * 100) : 0;
  const answered = results.filter((r) => !r.skipped);
  const avgMs = answered.length
    ? answered.reduce((acc, r) => acc + r.responseMs, 0) / answered.length
    : 0;
  const fastest = answered.length
    ? answered.reduce((min, r) => (r.responseMs < min.responseMs ? r : min))
    : null;
  const slowest = answered.length
    ? answered.reduce((max, r) => (r.responseMs > max.responseMs ? r : max))
    : null;
  const totalMs = results.reduce((acc, r) => acc + r.responseMs, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="space-y-6 p-6 text-center sm:p-10">
        <Trophy className="mx-auto h-12 w-12 text-[var(--color-primary)] sm:h-16 sm:w-16" />
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Game over</h2>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {round.playlistName}
          </p>
        </div>
        <div className="flex items-baseline justify-center gap-3">
          <span className="text-6xl font-semibold tabular-nums text-[var(--color-primary)] sm:text-7xl">
            {correct}
          </span>
          <span className="text-2xl text-[var(--color-muted-foreground)]">/ {results.length}</span>
        </div>
        <Button size="lg" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" /> Play again
        </Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Accuracy" value={`${accuracy}%`} accent />
        <StatBlock label="Correct" value={`${correct}`} />
        <StatBlock label="Missed" value={`${missed}`} />
        <StatBlock label="Skipped" value={`${skipped}`} />
        <StatBlock label="Avg response" value={fmtMs(avgMs)} />
        <StatBlock label="Fastest" value={fastest ? fmtMs(fastest.responseMs) : "—"} />
        <StatBlock label="Slowest" value={slowest ? fmtMs(slowest.responseMs) : "—"} />
        <StatBlock label="Total time" value={fmtMs(totalMs)} />
      </div>

      <Card className="overflow-hidden p-0">
        <h3 className="border-b-2 border-[var(--color-border)] px-5 py-4 text-xs font-medium text-[var(--color-muted-foreground)]">
          Round breakdown
        </h3>
        <ul className="divide-y-2 divide-[var(--color-border)]">
          {results.map((r, i) => {
            const status = r.skipped ? "skipped" : r.correct ? "correct" : "missed";
            return (
              <li key={i} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-muted)] font-mono text-xs">
                  {i + 1}
                </span>
                {r.trackCover ? (
                  <Image
                    src={r.trackCover}
                    alt={r.trackTitle}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-md border border-[var(--color-border)] object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold sm:text-base">{r.trackTitle}</p>
                  <p className="truncate text-xs text-[var(--color-muted-foreground)] sm:text-sm">{r.trackArtist}</p>
                  {r.guess ? (
                    <p className="mt-0.5 truncate text-xs italic text-[var(--color-muted-foreground)]">
                      Your guess: &ldquo;{r.guess}&rdquo;
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${
                  status === "correct"
                    ? "border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_25%,transparent)] text-[#3fb950]"
                    : status === "skipped"
                    ? "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                    : "border-[color-mix(in_oklch,var(--color-destructive)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-destructive)_25%,transparent)] text-[#f85149]"
                }`}>
                    {status === "correct" ? <Check className="h-3 w-3" /> : status === "skipped" ? <HelpCircle className="h-3 w-3" /> : null}
                    {status}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-[var(--color-muted-foreground)] sm:text-xs">
                    {fmtMs(r.responseMs)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{label}</p>
      <p className={`mt-1.5 font-mono text-2xl tabular-nums ${accent ? "text-[var(--color-primary)]" : ""}`}>
        {value}
      </p>
    </Card>
  );
}

function difficultyHue(sampleCount: number): number {
  switch (sampleCount) {
    case 5: return 145;
    case 4: return 200;
    case 3: return 280;
    case 2: return 330;
    case 1: return 25;
    default: return 330;
  }
}

function fmtMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0.0s";
  const sec = ms / 1000;
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s}s`;
  }
  return `${sec.toFixed(1)}s`;
}

function VolumeControl({
  volume,
  onChange,
}: {
  volume: number;
  onChange: (v: number) => void;
}) {
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const pct = Math.round(volume * 100);
  const trackStyle = {
    background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--color-muted) ${pct}%, var(--color-muted) 100%)`,
  };
  return (
    <div className="flex w-full min-w-0 items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2">
      <button
        type="button"
        onClick={() => onChange(volume === 0 ? 0.7 : 0)}
        className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
        aria-label={volume === 0 ? "Unmute" : "Mute"}
      >
        <Icon className="h-5 w-5" />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onChange(Number(e.target.value))}
        className="volume-slider h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-sm"
        style={trackStyle}
        aria-label="Volume"
      />
      <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--color-muted-foreground)]">
        {pct}%
      </span>
    </div>
  );
}

function Reveal({
  track,
  result,
  onNext,
}: {
  track: GameTrack;
  result: RoundResult;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
      {track.coverUrl ? (
        <Image
          src={track.coverUrl}
          alt={track.albumName}
          width={144}
          height={144}
          className="h-24 w-24 rounded-md border border-[var(--color-border)] object-cover sm:h-28 sm:w-28"
          unoptimized
        />
      ) : null}
      <div className="flex-1 space-y-3 min-w-0">
        <div className="space-y-1">
          <p className="truncate text-xl font-semibold sm:text-2xl">{track.title}</p>
          <p className="truncate text-sm text-[var(--color-muted-foreground)] sm:text-base">
            {track.artist} · {track.albumName}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={result.correct ? "success" : "destructive"} className="px-3 py-1 text-sm">
            {result.correct ? "Correct ✓" : "Missed ✗"}
          </Badge>
        </div>
      </div>
      <Button onClick={onNext} size="default" className="w-full sm:w-auto">
        Next <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
