"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { api } from "@/lib/api";
import type { Playlist } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistCard } from "@/components/playlist-card";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const me = await api.me();
        if (!me) {
          window.location.href = "/?error=not_authenticated";
          return;
        }
        const page = await api.playlists(0, 50);
        if (!aborted) setPlaylists(page.items.filter((p): p is Playlist => Boolean(p?.id)));
      } catch (e) {
        if (!aborted) setError(e instanceof Error ? e.message : "Failed to load playlists");
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight">samplr</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await api.logout();
            window.location.href = "/";
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </nav>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Choose a playlist</h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Spotify Premium required — playback streams to your Music Guessr device.
          </p>
        </header>

        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : !playlists ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">No playlists found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
