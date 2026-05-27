using MusicGuessr.Api.Endpoints;
using MusicGuessr.Api.Game;
using MusicGuessr.Api.Spotify;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<SpotifyOptions>(builder.Configuration.GetSection("Spotify"));
builder.Services.Configure<FrontendOptions>(builder.Configuration.GetSection("Frontend"));

builder.Services.AddHttpClient<SpotifyAuthService>();
builder.Services.AddHttpClient<SpotifyClient>();
builder.Services.AddSingleton<GameService>();

var frontendBase = builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(frontendBase)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

var app = builder.Build();

app.UseCors();

app.MapAuthEndpoints();
app.MapPlaylistEndpoints();
app.MapGameEndpoints();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();

public sealed class FrontendOptions
{
    public string BaseUrl { get; set; } = "http://localhost:3000";
}
