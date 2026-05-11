using BackendSource.DataBaseSystem;
using BackendSource.PermissionSystem;
using BackendSource.seeder;
using BackendSource.Services.APIServices;
using BackendSource.Services.CompleteServices;
using BackendSource.Services.Interfaces;
using BackendSource.Systems;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Diagnostics.Eventing.Reader;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.


builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.Configure<DatabaseSettings>(builder.Configuration.GetSection("DatabaseSettings"));


builder.Services.AddScoped<IPasswordHasher<UserTable>, PasswordHasher<UserTable>>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGameService, GamesSystem>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IKeyService, KeyService>();

builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddScoped<IProgramerService, ProgramerService>();

var dbSettings = builder.Configuration
    .GetSection("DatabaseSettings")
    .Get<DatabaseSettings>();

if (dbSettings == null)
    throw new Exception("DataBase its null");


var connectionString =
    $"Host={dbSettings.Server};" +
    $"Port={dbSettings.Port};" +
    $"Database={dbSettings.Database};" +
    $"Username={dbSettings.User};" +
    $"Password={dbSettings.Password};";

builder.Services.AddDbContext<DbContextBa>(options => options.UseNpgsql(
    connectionString
));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),

        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.Name,
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine(context.Exception);
            return Task.CompletedTask;
        }
    };
});

var frontedUrl = builder.Configuration.GetValue<string>("Frontend");

if (string.IsNullOrWhiteSpace(frontedUrl))
    throw new Exception("Frontend origin not configured");

frontedUrl = frontedUrl.TrimEnd('/');

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(frontedUrl)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddSignalR().AddJsonProtocol(options => { options.PayloadSerializerOptions.PropertyNamingPolicy = null; });

builder.Services.AddAuthorization(options =>
{

    foreach (var Permission in PolicyNames.all)
    {
        options.AddPolicy(Permission, policy => policy.Requirements.Add(new PermissionRequirement(Permission)));
    }
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (args.Contains("-createEverything"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DbContextBa>();
    try
    {
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        Console.WriteLine(ex.ToString());
    }

    var context = scope.ServiceProvider.GetRequiredService<DbContextBa>();
    await PermissionSeeder.seedAsync(context);
    await RoleSeeder.SeedAsync(context);


    var path = Path.GetFullPath("GameFiles");

    if (!Directory.Exists(path))
    {
        Directory.CreateDirectory(path);
    }

    Console.WriteLine($"Ruta completa: {path}");

    var dirs = Directory.GetDirectories(path);
    foreach (var dir in dirs)
    {
        Console.WriteLine(dir);
    }
}



app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
