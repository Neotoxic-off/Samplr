import type { GameRound, Playlist, PlaylistPage, SpotifyMe } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  loginUrl: () => `${API}/api/auth/login`,
  logout: () => fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" }),

  me: async (): Promise<SpotifyMe | null> => {
    const res = await fetch(`${API}/api/auth/me`, { credentials: "include", cache: "no-store" });
    if (res.status === 401) return null;
    return jsonOrThrow<SpotifyMe>(res);
  },

  token: async (): Promise<string | null> => {
    const res = await fetch(`${API}/api/auth/token`, { credentials: "include", cache: "no-store" });
    if (res.status === 401) return null;
    const data = await jsonOrThrow<{ access_token: string }>(res);
    return data.access_token;
  },

  playlists: async (offset = 0, limit = 50): Promise<PlaylistPage> => {
    const res = await fetch(`${API}/api/playlists/?limit=${limit}&offset=${offset}`, {
      credentials: "include",
      cache: "no-store",
    });
    return jsonOrThrow<PlaylistPage>(res);
  },

  playlist: async (id: string): Promise<Playlist> => {
    const res = await fetch(`${API}/api/playlists/${id}`, { credentials: "include" });
    return jsonOrThrow<Playlist>(res);
  },

  startGame: async (
    playlistId: string,
    opts: { rounds?: number; sampleCount?: number; sampleLengthSec?: number } = {},
  ): Promise<GameRound> => {
    const res = await fetch(`${API}/api/game/${playlistId}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rounds: opts.rounds ?? 10,
        sampleCount: opts.sampleCount ?? 3,
        sampleLengthSec: opts.sampleLengthSec ?? 2,
      }),
    });
    return jsonOrThrow<GameRound>(res);
  },
};

export { API };
