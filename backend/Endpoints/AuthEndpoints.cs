using Microsoft.Extensions.Options;
using MusicGuessr.Api.Spotify;

namespace MusicGuessr.Api.Endpoints;

public static class AuthEndpoints
{
    private const string AccessCookie = "mg_access";
    private const string RefreshCookie = "mg_refresh";
    private const string StateCookie = "mg_state";

    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapGet("/login", (HttpContext ctx, SpotifyAuthService auth) =>
        {
            var state = Guid.NewGuid().ToString("N");
            ctx.Response.Cookies.Append(StateCookie, state, ShortLivedCookie());
            return Results.Redirect(auth.BuildAuthorizeUrl(state));
        });

        group.MapGet("/callback", async (
            HttpContext ctx,
            string? code,
            string? state,
            string? error,
            SpotifyAuthService auth,
            IOptions<FrontendOptions> frontend,
            CancellationToken ct) =>
        {
            var fe = frontend.Value.BaseUrl;
            if (!string.IsNullOrEmpty(error))
                return Results.Redirect($"{fe}/?error={Uri.EscapeDataString(error)}");

            var expectedState = ctx.Request.Cookies[StateCookie];
            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state) || state != expectedState)
                return Results.Redirect($"{fe}/?error=state_mismatch");

            var token = await auth.ExchangeCodeAsync(code, ct);

            ctx.Response.Cookies.Delete(StateCookie);
            ctx.Response.Cookies.Append(AccessCookie, token.AccessToken, SessionCookie(TimeSpan.FromSeconds(token.ExpiresIn - 30)));
            if (!string.IsNullOrEmpty(token.RefreshToken))
                ctx.Response.Cookies.Append(RefreshCookie, token.RefreshToken, SessionCookie(TimeSpan.FromDays(30)));

            return Results.Redirect($"{fe}/playlists");
        });

        group.MapPost("/logout", (HttpContext ctx) =>
        {
            ctx.Response.Cookies.Delete(AccessCookie);
            ctx.Response.Cookies.Delete(RefreshCookie);
            return Results.Ok(new { ok = true });
        });

        group.MapGet("/me", async (HttpContext ctx, SpotifyClient spotify, CancellationToken ct) =>
        {
            var token = await TokenAccessor.GetAsync(ctx);
            if (token is null) return Results.Unauthorized();
            var me = await spotify.GetMeAsync(token, ct);
            return Results.Ok(me);
        });

        group.MapGet("/token", async (HttpContext ctx, SpotifyAuthService auth, CancellationToken ct) =>
        {
            var access = ctx.Request.Cookies[AccessCookie];
            if (!string.IsNullOrEmpty(access))
                return Results.Ok(new { access_token = access });

            var refresh = ctx.Request.Cookies[RefreshCookie];
            if (string.IsNullOrEmpty(refresh)) return Results.Unauthorized();

            var token = await auth.RefreshAsync(refresh, ct);
            ctx.Response.Cookies.Append(AccessCookie, token.AccessToken, SessionCookie(TimeSpan.FromSeconds(token.ExpiresIn - 30)));
            if (!string.IsNullOrEmpty(token.RefreshToken))
                ctx.Response.Cookies.Append(RefreshCookie, token.RefreshToken, SessionCookie(TimeSpan.FromDays(30)));
            return Results.Ok(new { access_token = token.AccessToken });
        });
    }

    private static CookieOptions ShortLivedCookie() => new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = false,
        Path = "/",
        MaxAge = TimeSpan.FromMinutes(10)
    };

    private static CookieOptions SessionCookie(TimeSpan maxAge) => new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = false,
        Path = "/",
        MaxAge = maxAge
    };
}

public static class TokenAccessor
{
    public static Task<string?> GetAsync(HttpContext ctx)
    {
        var access = ctx.Request.Cookies["mg_access"];
        return Task.FromResult(string.IsNullOrEmpty(access) ? null : access);
    }
}
