# Music Guessr

Guess the artist and the title from cropped samples of your Spotify playlists. Live audio visualizer, sample timeline, fully containerized.

## Stack

- **Frontend** Next.js 16 (App Router, RSC), React 19, TypeScript, Tailwind CSS v4, shadcn-style UI primitives, lucide-react icons, Web Audio API visualizer.
- **Backend** ASP.NET Core .NET 10 minimal API. Handles Spotify OAuth (auth code flow), playlist fetch, random track / sample picking.
- **Infra** Docker Compose. Two services: `frontend` (port 3000) and `backend` (port 5000).

## Quick start

1. Create a Spotify app at <https://developer.spotify.com/dashboard>.
   - Add `http://localhost:5000/api/auth/callback` as a redirect URI.
   - Copy the Client ID and Client Secret.

2. Configure the environment:

   ```bash
   cp .env.example .env
   # edit .env with your credentials
   ```

3. Run:

   ```bash
   docker compose up --build
   ```

4. Open <http://localhost:3000>. Sign in with Spotify, pick a playlist, play.

## How it works

- The backend builds a `GameRound` per playlist: picks N random tracks that have a Spotify preview, then crops K non-overlapping samples of given length at random offsets within the 30s preview.
- The frontend plays the full 30s preview through a `<audio>` element, taps it with a `MediaElementAudioSourceNode` + `AnalyserNode` for the visualizer, and seeks to each sample window on demand.
- Guess is matched case-insensitively with accent and punctuation stripped, using substring containment in either direction.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/auth/login` | Redirects to Spotify authorize |
| `GET`  | `/api/auth/callback` | OAuth callback, sets HttpOnly cookies |
| `GET`  | `/api/auth/me` | Current Spotify user |
| `POST` | `/api/auth/logout` | Clears cookies |
| `GET`  | `/api/playlists/` | Current user playlists (paged) |
| `GET`  | `/api/playlists/{id}` | Playlist metadata |
| `POST` | `/api/game/{playlistId}` | Builds a randomized round; body `{ rounds, sampleCount, sampleLengthSec }` |
| `GET`  | `/api/health` | Liveness |

## Project layout

```
backend/
  Program.cs
  Endpoints/{Auth,Playlist,Game}Endpoints.cs   # 1 file per route group
  Spotify/{SpotifyAuthService,SpotifyClient,SpotifyOptions,Models}.cs
  Game/{GameService,GameModels}.cs
frontend/
  app/{page,playlists/page,game/[id]/page,layout,globals.css}
  components/{visualizer,sample-timeline,playlist-card,game-board,ui/*}
  lib/{api,types,utils}.ts
docker-compose.yml
.env.example
```

## Notes

- Tracks without a `preview_url` are filtered out — Spotify does not return previews for every track. Pick playlists with mainstream catalog if a round comes back empty.
- Cookies are issued by the backend on the same host; the frontend talks to the backend with `credentials: "include"`. CORS is locked to `FRONTEND_BASE_URL`.
- Set `Secure = true` on the auth cookies before deploying behind HTTPS.
