using MusicGuessr.Api.Spotify;

namespace MusicGuessr.Api.Game;

public sealed class GameService
{
    public GameRound BuildRound(
        SpotifyPlaylist playlist,
        IReadOnlyList<SpotifyTrack> tracks,
        int rounds,
        int sampleCount,
        double sampleLengthSec)
    {
        rounds = Math.Clamp(rounds, 5, 100);
        sampleCount = Math.Clamp(sampleCount, 1, 6);
        sampleLengthSec = Math.Clamp(sampleLengthSec, 0.5, 10.0);

        var pool = tracks
            .Where(t => !string.IsNullOrEmpty(t.Uri) && !string.IsNullOrEmpty(t.Id) && t.DurationMs > 0)
            .GroupBy(t => t.Id)
            .Select(g => g.First())
            .ToList();

        if (pool.Count == 0)
            throw new InvalidOperationException("No playable tracks in this playlist.");

        var rng = Random.Shared;
        var picked = pool
            .OrderBy(_ => rng.Next())
            .Take(Math.Min(rounds, pool.Count))
            .Select(t => MapTrack(t, sampleCount, sampleLengthSec, rng))
            .ToList();

        return new GameRound(
            PlaylistId: playlist.Id,
            PlaylistName: playlist.Name,
            SampleCount: sampleCount,
            SampleLengthSec: sampleLengthSec,
            Tracks: picked
        );
    }

    private static GameTrack MapTrack(SpotifyTrack t, int sampleCount, double sampleLengthSec, Random rng)
    {
        var durationSec = t.DurationMs / 1000.0;
        var samples = PickSamples(durationSec, sampleCount, sampleLengthSec, rng);
        var cover = t.Album?.Images?.OrderByDescending(i => i.Width ?? 0).FirstOrDefault()?.Url;
        return new GameTrack(
            Id: t.Id!,
            Uri: t.Uri!,
            Title: t.Name,
            Artist: string.Join(", ", t.Artists.Select(a => a.Name)),
            AlbumName: t.Album?.Name ?? "",
            CoverUrl: cover,
            DurationSec: durationSec,
            Samples: samples
        );
    }

    private static List<Sample> PickSamples(double total, int count, double length, Random rng)
    {
        var maxStart = Math.Max(0.0, total - length);
        var result = new List<Sample>(count);
        var attempts = 0;
        while (result.Count < count && attempts < count * 20)
        {
            attempts++;
            var start = rng.NextDouble() * maxStart;
            var overlaps = result.Any(s => start < s.StartSec + s.LengthSec && start + length > s.StartSec);
            if (overlaps) continue;
            result.Add(new Sample(Math.Round(start, 2), length));
        }
        return result.OrderBy(s => s.StartSec).ToList();
    }
}
