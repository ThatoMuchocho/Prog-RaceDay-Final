using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RaceDay.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Controllers and Swagger/OpenAPI
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RaceDay API",
        Version = "v1",
        Description = "RaceDay Event Management System - PROG6212 Part 2"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste your JWT token here. Swagger will send it as a Bearer token."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// SQL Server / Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("RaceDay");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'RaceDay' was not found in appsettings.json.");
}

builder.Services.AddDbContext<RaceDayDbContext>(options =>
    options.UseSqlServer(connectionString));

// JWT authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"];
var jwtIssuer = jwtSection["Issuer"];
var jwtAudience = jwtSection["Audience"];

if (string.IsNullOrWhiteSpace(jwtKey) ||
    Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "Set Jwt:Key in appsettings.json to a private secret of at least 32 bytes.");
}

if (string.IsNullOrWhiteSpace(jwtIssuer) ||
    string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "Set Jwt:Issuer and Jwt:Audience in appsettings.json.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name
        };
    });

builder.Services.AddAuthorization();

// Pipeline
var app = builder.Build();

// Redirect HTTP to HTTPS, then serve the RaceDay website from wwwroot.
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();

// Keep the API explorer available for this coursework application in Development and local demonstration runs.
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "RaceDay API v1");
    options.RoutePrefix = "swagger";
    options.DocumentTitle = "RaceDay API - Swagger";
    options.InjectStylesheet("/css/swagger-raceday.css");
});

// Friendly shortcut: /api opens the interactive API documentation.
app.MapGet("/api", () => Results.Redirect("/swagger"))
   .ExcludeFromDescription();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Makes Program accessible to integration tests.
public partial class Program { }
