using MusicGuessr.Api.Game;
using MusicGuessr.Api.Spotify;

namespace MusicGuessr.Api.Endpoints;

public static class GameEndpoints
{
    public static void MapGameEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/game");

        group.MapPost("/{playlistId}", async (
            HttpContext ctx,
            SpotifyClient spotify,
            GameService game,
            string playlistId,
            GameRequest? req,
            CancellationToken ct) =>
        {
            var token = await TokenAccessor.GetAsync(ctx);
            if (token is null) return Results.Unauthorized();

            var playlist = await spotify.GetPlaylistAsync(token, playlistId, ct);
            var rounds = Math.Clamp(req?.Rounds ?? 20, 5, 100);
            var fetchCount = Math.Min(playlist.Tracks?.Total ?? 0, rounds * 2);
            var tracks = await spotify.GetRandomPlaylistTracksAsync(token, playlistId, playlist.Tracks?.Total ?? 0, fetchCount, ct);

            try
            {
                var round = game.BuildRound(
                    playlist,
                    tracks,
                    rounds,
                    req?.SampleCount ?? 3,
                    req?.SampleLengthSec ?? 2.0);
                return Results.Ok(round);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(ex.Message, statusCode: 422);
            }
        });
    }
}
