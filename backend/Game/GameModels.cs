namespace MusicGuessr.Api.Game;

public sealed record Sample(double StartSec, double LengthSec);

public sealed record GameTrack(
    string Id,
    string Uri,
    string Title,
    string Artist,
    string AlbumName,
    string? CoverUrl,
    double DurationSec,
    IReadOnlyList<Sample> Samples
);

public sealed record GameRound(
    string PlaylistId,
    string PlaylistName,
    int SampleCount,
    double SampleLengthSec,
    IReadOnlyList<GameTrack> Tracks
);

public sealed record GameRequest(int? Rounds, int? SampleCount, double? SampleLengthSec);
