"use client";

import Image from "next/image";
import Link from "next/link";
import { Music2, Play } from "lucide-react";
import type { Playlist } from "@/lib/types";
import { Card } from "@/components/ui/card";

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const img = playlist.images?.[0]?.url;
  const total = playlist.items?.total ?? 0;
  return (
    <Link href={`/game/${playlist.id}`} className="group">
      <Card className="overflow-hidden p-3 transition-all hover:border-[var(--color-primary)]/60 hover:shadow-lg hover:shadow-[var(--color-primary)]/5">
        <div className="relative aspect-square w-full overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]">
          {img ? (
            <Image
              src={img}
              alt={playlist.name}
              fill
              sizes="(min-width: 1024px) 220px, 45vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Music2 className="h-12 w-12 text-[var(--color-muted-foreground)]" />
            </div>
          )}
          <div className="absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg">
              <Play className="h-4 w-4 fill-current" />
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-0.5">
          <p className="truncate text-sm font-medium">{playlist.name}</p>
          <p className="truncate text-xs text-[var(--color-muted-foreground)]">
            {total} track{total === 1 ? "" : "s"}
            {playlist.owner?.display_name ? ` · ${playlist.owner.display_name}` : ""}
          </p>
        </div>
      </Card>
    </Link>
  );
}
