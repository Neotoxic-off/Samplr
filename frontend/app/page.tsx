import Link from "next/link";
import { ListMusic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { api } from "@/lib/api";

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <Landing searchParams={searchParams} />;
}

async function Landing({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight">samplr</span>
        </Link>
        <a href={api.loginUrl()}>
          <Button variant="secondary" size="sm">
            Sign in with Spotify
          </Button>
        </a>
      </nav>

      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 text-center sm:pt-28">
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]">
          <Sparkles className="h-3 w-3 text-[var(--color-primary)]" />
          From any of your Spotify playlists
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Guess the track from tiny samples
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base text-[var(--color-muted-foreground)]">
          Pick a playlist. We pull random chunks from random tracks. You guess the artist or the title.
        </p>
        <div className="mt-8 flex gap-3">
          <a href={api.loginUrl()}>
            <Button size="lg">
              <ListMusic className="h-4 w-4" />
              Connect Spotify
            </Button>
          </a>
        </div>
        {error ? (
          <p className="mt-6 text-sm text-[#f85149]">Auth failed: {error}</p>
        ) : null}
      </section>

      <section className="mx-auto mt-24 grid max-w-4xl gap-3 px-6 pb-24 sm:mt-28 sm:grid-cols-3">
        <Feature title="Any playlist" body="Browse all of your Spotify playlists. Pick the one to play." />
        <Feature title="Random samples" body="Each track is cropped into short snippets at random positions." />
        <Feature title="Live waveform" body="See where each sample sits in the song while it plays." />
      </section>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">{body}</p>
    </div>
  );
}
