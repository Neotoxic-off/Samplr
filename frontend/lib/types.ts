export type SpotifyImage = { url: string; height?: number | null; width?: number | null };

export type SpotifyMe = {
  id: string;
  display_name: string | null;
  images: SpotifyImage[] | null;
};

export type Playlist = {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[] | null;
  owner: { display_name: string | null } | null;
  items: { total: number } | null;
};

export type PlaylistPage = {
  items: Playlist[];
  total: number;
  next: string | null;
};

export type Sample = { startSec: number; lengthSec: number };

export type GameTrack = {
  id: string;
  uri: string;
  title: string;
  artist: string;
  albumName: string;
  coverUrl: string | null;
  durationSec: number;
  samples: Sample[];
};

export type GameRound = {
  playlistId: string;
  playlistName: string;
  sampleCount: number;
  sampleLengthSec: number;
  tracks: GameTrack[];
};
