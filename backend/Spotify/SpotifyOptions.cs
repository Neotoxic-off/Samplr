namespace MusicGuessr.Api.Spotify;

public sealed class SpotifyOptions
{
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
    public string RedirectUri { get; set; } = "";
    public string Scopes { get; set; } = "playlist-read-private playlist-read-collaborative user-read-private user-read-email streaming user-read-playback-state user-modify-playback-state";
}
