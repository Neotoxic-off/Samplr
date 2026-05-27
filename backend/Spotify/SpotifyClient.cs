using System.Net.Http.Headers;
using System.Text.Json;

namespace MusicGuessr.Api.Spotify;

public sealed class SpotifyClient
{
    private readonly HttpClient _http;

    public SpotifyClient(HttpClient http)
    {
        _http = http;
        _http.BaseAddress = new Uri("https://api.spotify.com/");
    }

    public async Task<SpotifyUser> GetMeAsync(string accessToken, CancellationToken ct)
        => await GetJsonAsync<SpotifyUser>(accessToken, "v1/me", ct);

    public async Task<SpotifyPaging<SpotifyPlaylist>> GetUserPlaylistsAsync(string accessToken, int limit, int offset, CancellationToken ct)
        => await GetJsonAsync<SpotifyPaging<SpotifyPlaylist>>(accessToken, $"v1/me/playlists?limit={limit}&offset={offset}", ct);

    public async Task<SpotifyPlaylist> GetPlaylistAsync(string accessToken, string id, CancellationToken ct)
        => await GetJsonAsync<SpotifyPlaylist>(accessToken, $"v1/playlists/{id}?fields=id,name,description,images,owner.display_name,items.total", ct);

    public async Task<List<SpotifyTrack>> GetRandomPlaylistTracksAsync(string accessToken, string id, int total, int count, CancellationToken ct)
    {
        if (total <= 0 || count <= 0) return new();
        var rng = Random.Shared;
        var sampleSize = Math.Min(total, count);
        var picked = new HashSet<int>();
        while (picked.Count < sampleSize) picked.Add(rng.Next(total));
        var tasks = picked.Select(o => GetItemAtOffsetAsync(accessToken, id, o, ct));
        var results = await Task.WhenAll(tasks);
        return results.Where(t => t is not null).Cast<SpotifyTrack>().ToList();
    }

    private async Task<SpotifyTrack?> GetItemAtOffsetAsync(string accessToken, string id, int offset, CancellationToken ct)
    {
        var url = $"v1/playlists/{id}/items?limit=1&offset={offset}&fields=items(item(id,uri,name,duration_ms,artists(id,name),album(id,name,images)))";
        var page = await GetJsonAsync<SpotifyPaging<SpotifyPlaylistTrackItem>>(accessToken, url, ct);
        return page.Items.FirstOrDefault()?.Track;
    }

    private async Task<T> GetJsonAsync<T>(string accessToken, string path, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, path);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var res = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"Spotify {path} {(int)res.StatusCode}: {body}");
        return JsonSerializer.Deserialize<T>(body)
            ?? throw new InvalidOperationException($"Empty body for {path}");
    }
}
