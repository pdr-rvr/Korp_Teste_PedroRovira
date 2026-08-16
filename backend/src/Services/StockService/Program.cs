using BuildingBlocks.Common.Idempotency;
using BuildingBlocks.Common.Middlewares;
using BuildingBlocks.Common.Swagger;
using Microsoft.EntityFrameworkCore;
using StockService.Infrastructure;
using StockService.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuração do PostgreSQL com Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<StockDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorCodesToAdd: null);
    });
});

// Injeção de Dependências dos Serviços de Domínio
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddSingleton<FaultSimulatorState>();
builder.Services.AddSingleton<IIdempotencyStore, InMemoryIdempotencyStore>();

// Configuração de Controllers e JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Configuração de CORS para permitir comunicação com o Frontend Angular
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Swagger/OpenAPI
builder.Services.AddCommonSwagger("KORP ERP - Stock Service", "v1", "Microsserviço de Controle de Estoque e Catálogo de Produtos");

var app = builder.Build();

// Middleware Global de Tratamento de Exceções (RFC 7807)
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseCommonSwagger("Stock Service API v1");
}

app.UseAuthorization();
app.MapControllers();

// Inicialização e Seed do Banco de Dados PostgreSQL
await DbInitializer.InitializeAsync(app.Services);

app.Run();
