using BackendSource.DataBaseSystem;
using BackendSource.PermissionSystem;
using BackendSource.seeder;
using BackendSource.Services.APIServices;
using BackendSource.Services.CompleteServices;
using BackendSource.Services.Interfaces;
using BackendSource.Systems;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = null;
});

builder.Services.Configure<FormOptions>(x =>
{
    x.ValueLengthLimit = int.MaxValue;
    x.MultipartBodyLengthLimit = int.MaxValue;
    x.MemoryBufferThreshold = int.MaxValue;
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.Configure<DatabaseSettings>(builder.Configuration.GetSection("DatabaseSettings"));


builder.Services.AddScoped<IPasswordHasher<UserTable>, PasswordHasher<UserTable>>();

Stripe.StripeConfiguration.ApiKey = builder.Configuration.GetSection("Stripe")["SecretKey"];

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGameService, GamesSystem>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IKeyService, KeyService>();

builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddScoped<IProgramerService, ProgramerService>();
builder.Services.AddScoped<IMeService, MeService>();

builder.Services.AddScoped<IAmazonS3>(_ =>
{
    var config = new AmazonS3Config()
    {
        ServiceURL = builder.Configuration["Aws:ServiceUrl"],
        ForcePathStyle = true
    };
    
    return new AmazonS3Client(new BasicAWSCredentials(builder.Configuration["Aws:AccessKey"], builder.Configuration["Aws:SecretKey"]), config);
});

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

    foreach (var permission in PolicyNames.all)
    {
        options.AddPolicy(permission, policy => policy.Requirements.Add(new PermissionRequirement(permission)));
    }
});

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        if (exceptionHandlerPathFeature?.Error != null)
        {
            Console.WriteLine($"[CRITICAL ERROR] An unhandled exception occurred:");
            Console.WriteLine(exceptionHandlerPathFeature.Error.ToString());
        }

        await context.Response.WriteAsJsonAsync(new { error = "An internal server error has occurred." });
    });
});

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
    
    bool useS3 = builder.Configuration.GetValue<bool>("UseS3");
    if (useS3)
    {
        var s3 = scope.ServiceProvider.GetRequiredService<IAmazonS3>();

        var bucketName = builder.Configuration["Aws:BucketName"];
        var buckets = await s3.ListBucketsAsync();

        var exists = buckets.Buckets.Any(b => b.BucketName == bucketName);
        if (!exists)
        {
            await s3.PutBucketAsync(new PutBucketRequest
            {
                BucketName = bucketName
            });

            Console.WriteLine($"Bucket Create: {bucketName}");
        }
        else
        {
            Console.WriteLine($"Bucket already created: {bucketName}");
        }
    }
    else
    {
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
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
