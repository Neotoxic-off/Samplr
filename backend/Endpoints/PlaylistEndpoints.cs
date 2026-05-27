using MusicGuessr.Api.Spotify;

namespace MusicGuessr.Api.Endpoints;

public static class PlaylistEndpoints
{
    public static void MapPlaylistEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/playlists");

        group.MapGet("/", async (HttpContext ctx, SpotifyClient spotify, int? limit, int? offset, CancellationToken ct) =>
        {
            var token = await TokenAccessor.GetAsync(ctx);
            if (token is null) return Results.Unauthorized();

            var page = await spotify.GetUserPlaylistsAsync(token, limit ?? 50, offset ?? 0, ct);
            return Results.Ok(page);
        });

        group.MapGet("/{id}", async (HttpContext ctx, SpotifyClient spotify, string id, CancellationToken ct) =>
        {
            var token = await TokenAccessor.GetAsync(ctx);
            if (token is null) return Results.Unauthorized();

            var playlist = await spotify.GetPlaylistAsync(token, id, ct);
            return Results.Ok(playlist);
        });
    }
}
