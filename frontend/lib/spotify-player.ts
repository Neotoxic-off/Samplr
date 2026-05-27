"use client";

import { useEffect, useRef, useState } from "react";
import { api, API } from "./api";

declare global {
  interface Window {
    Spotify: {
      Player: new (opts: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

type SpotifyPlayer = {
  addListener(event: "ready", cb: (e: { device_id: string }) => void): void;
  addListener(event: "not_ready", cb: (e: { device_id: string }) => void): void;
  addListener(event: "player_state_changed", cb: (state: PlayerState | null) => void): void;
  addListener(event: "initialization_error" | "authentication_error" | "account_error" | "playback_error", cb: (e: { message: string }) => void): void;
  connect(): Promise<boolean>;
  disconnect(): void;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(ms: number): Promise<void>;
  setVolume(v: number): Promise<void>;
  getCurrentState(): Promise<PlayerState | null>;
  activateElement?: () => Promise<void>;
};

export type PlayerState = {
  position: number;
  duration: number;
  paused: boolean;
  track_window: {
    current_track: {
      id: string;
      uri: string;
      name: string;
      linked_from?: { uri?: string; id?: string };
    };
  };
};

let scriptLoaded = false;
function loadSdk(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      scriptLoaded = true;
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://sdk.scdn.co/spotify-player.js";
    s.async = true;
    document.body.appendChild(s);
  });
}

export type PlayerHandle = {
  ready: boolean;
  error: string | null;
  deviceId: string | null;
  volume: number;
  playTrack: (uri: string, positionMs: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  setVolume: (v: number) => Promise<void>;
  getState: () => Promise<PlayerState | null>;
};

const VOLUME_KEY = "mg:volume";

export function useSpotifyPlayer(): PlayerHandle {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === "undefined") return 0.7;
    const stored = window.localStorage.getItem(VOLUME_KEY);
    return stored ? Math.max(0, Math.min(1, parseFloat(stored))) : 0.7;
  });
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const tokenRef = useRef<string | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadSdk();
      if (cancelled) return;
      const player = new window.Spotify.Player({
        name: "samplr",
        volume: volumeRef.current,
        getOAuthToken: (cb) => {
          api.token().then((t) => {
            if (t) {
              tokenRef.current = t;
              cb(t);
            }
          });
        },
      });
      player.addListener("ready", async ({ device_id }) => {
        setDeviceId(device_id);
        setReady(true);
        const token = tokenRef.current ?? (await api.token());
        if (token) {
          tokenRef.current = token;
          await fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ device_ids: [device_id], play: false }),
          }).catch(() => {});
        }
      });
      player.addListener("not_ready", () => setReady(false));
      player.addListener("player_state_changed", (state) => {
        if (state) {
          console.debug("[player] state", state.track_window.current_track.uri, "paused=", state.paused, "pos=", state.position);
        }
      });
      player.addListener("initialization_error", ({ message }) => setError(message));
      player.addListener("authentication_error", ({ message }) => setError(message));
      player.addListener("account_error", ({ message }) => setError(message));
      player.addListener("playback_error", ({ message }) => setError(message));
      await player.connect();
      playerRef.current = player;
    })();
    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, []);

  const playTrack = async (uri: string, positionMs: number) => {
    const token = tokenRef.current ?? (await api.token());
    if (!token || !deviceId) return;
    tokenRef.current = token;
    if (!uri || !uri.startsWith("spotify:track:")) {
      console.error("[player] Refusing to play invalid uri:", uri);
      return;
    }
    await playerRef.current?.activateElement?.().catch(() => {});
    await playerRef.current?.pause().catch(() => {});
    await new Promise((r) => setTimeout(r, 60));
    console.debug("[player] play", uri, "@", positionMs, "device", deviceId);

    try {
      const devRes = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (devRes.ok) {
        const data = (await devRes.json()) as { devices: { id: string; is_active: boolean }[] };
        const others = data.devices.filter((d) => d.id && d.id !== deviceId && d.is_active);
        if (others.length > 0) {
          console.debug("[player] pausing other active devices:", others.map((d) => d.id));
          await Promise.all(
            others.map((d) =>
              fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${d.id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
              }).catch(() => null),
            ),
          );
        }
      }
    } catch {}

    const transferRes = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    }).catch(() => null);
    if (transferRes && !transferRes.ok && transferRes.status !== 204) {
      console.warn("[player] transfer failed", transferRes.status);
    }
    const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [uri], position_ms: positionMs }),
    });
    if (!res.ok) console.warn("[player] play failed", res.status, await res.text().catch(() => ""));

    const enforceSeek = async () => {
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 120));
        const state = await playerRef.current?.getCurrentState();
        if (state && state.track_window.current_track.uri === uri) {
          if (Math.abs(state.position - positionMs) > 500) {
            await playerRef.current?.seek(positionMs).catch(() => {});
          }
          return;
        }
      }
    };
    enforceSeek();
  };

  const pause = async () => {
    await playerRef.current?.pause();
  };
  const resume = async () => {
    await playerRef.current?.resume();
  };
  const seek = async (ms: number) => {
    await playerRef.current?.seek(ms);
  };
  const setVolume = async (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (typeof window !== "undefined") window.localStorage.setItem(VOLUME_KEY, clamped.toString());
    await playerRef.current?.setVolume(clamped);
  };
  const getState = async () => (await playerRef.current?.getCurrentState()) ?? null;

  return { ready, error, deviceId, volume, playTrack, pause, resume, seek, setVolume, getState };
}

export { API };
