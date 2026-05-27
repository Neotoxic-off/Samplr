using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace MusicGuessr.Api.Spotify;

public sealed class SpotifyAuthService
{
    private readonly HttpClient _http;
    private readonly SpotifyOptions _opts;

    public SpotifyAuthService(HttpClient http, IOptions<SpotifyOptions> opts)
    {
        _http = http;
        _opts = opts.Value;
    }

    public string BuildAuthorizeUrl(string state)
    {
        var query = new Dictionary<string, string?>
        {
            ["client_id"] = _opts.ClientId,
            ["response_type"] = "code",
            ["redirect_uri"] = _opts.RedirectUri,
            ["scope"] = _opts.Scopes,
            ["state"] = state,
            ["show_dialog"] = "false"
        };
        var qs = string.Join("&", query.Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value ?? "")}"));
        return $"https://accounts.spotify.com/authorize?{qs}";
    }

    public async Task<SpotifyTokenResponse> ExchangeCodeAsync(string code, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
        req.Headers.Authorization = new AuthenticationHeaderValue("Basic", BasicCreds());
        req.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = _opts.RedirectUri
        });
        return await SendTokenAsync(req, ct);
    }

    public async Task<SpotifyTokenResponse> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
        req.Headers.Authorization = new AuthenticationHeaderValue("Basic", BasicCreds());
        req.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken
        });
        return await SendTokenAsync(req, ct);
    }

    private async Task<SpotifyTokenResponse> SendTokenAsync(HttpRequestMessage req, CancellationToken ct)
    {
        using var res = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"Spotify token error {(int)res.StatusCode}: {body}");
        return JsonSerializer.Deserialize<SpotifyTokenResponse>(body)
            ?? throw new InvalidOperationException("Empty token response");
    }

    private string BasicCreds() =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_opts.ClientId}:{_opts.ClientSecret}"));
}
