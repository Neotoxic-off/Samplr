using System.Text.Json.Serialization;

namespace MusicGuessr.Api.Spotify;

public sealed record SpotifyTokenResponse(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("token_type")] string TokenType,
    [property: JsonPropertyName("expires_in")] int ExpiresIn,
    [property: JsonPropertyName("refresh_token")] string? RefreshToken,
    [property: JsonPropertyName("scope")] string? Scope
);

public sealed record SpotifyImage(
    [property: JsonPropertyName("url")] string Url,
    [property: JsonPropertyName("height")] int? Height,
    [property: JsonPropertyName("width")] int? Width
);

public sealed record SpotifyUser(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("display_name")] string? DisplayName,
    [property: JsonPropertyName("images")] List<SpotifyImage>? Images
);

public sealed record SpotifyPlaylistOwner(
    [property: JsonPropertyName("display_name")] string? DisplayName
);

public sealed record SpotifyPlaylistTracksRef(
    [property: JsonPropertyName("total")] int Total
);

public sealed record SpotifyPlaylist(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("images")] List<SpotifyImage>? Images,
    [property: JsonPropertyName("owner")] SpotifyPlaylistOwner? Owner,
    [property: JsonPropertyName("items")] SpotifyPlaylistTracksRef? Tracks
);

public sealed record SpotifyPaging<T>(
    [property: JsonPropertyName("items")] List<T> Items,
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("next")] string? Next
);

public sealed record SpotifyArtist(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name
);

public sealed record SpotifyAlbum(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("images")] List<SpotifyImage>? Images
);

public sealed record SpotifyTrack(
    [property: JsonPropertyName("id")] string? Id,
    [property: JsonPropertyName("uri")] string? Uri,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("duration_ms")] int DurationMs,
    [property: JsonPropertyName("artists")] List<SpotifyArtist> Artists,
    [property: JsonPropertyName("album")] SpotifyAlbum? Album
);

public sealed record SpotifyPlaylistTrackItem(
    [property: JsonPropertyName("item")] SpotifyTrack? Track
);
