using BuildingBlocks.Common.Idempotency;
using BuildingBlocks.Common.Middlewares;
using BuildingBlocks.Common.Swagger;
using BillingService.HttpClients;
using BillingService.Infrastructure;
using BillingService.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configuração do PostgreSQL com Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<BillingDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorCodesToAdd: null);
    });
});

// Configuração do Cliente HTTP com Políticas de Resiliência do Polly
var stockServiceUrl = builder.Configuration.GetValue<string>("StockService:BaseUrl") ?? "http://localhost:5001";

builder.Services.AddHttpClient<IStockServiceClient, StockServiceClient>(client =>
{
    client.BaseAddress = new Uri(stockServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(10);
})
.AddPolicyHandler((sp, request) =>
{
    var logger = sp.GetRequiredService<ILogger<StockServiceClient>>();
    return PollyExtensions.GetRetryPolicy(logger);
})
.AddPolicyHandler((sp, request) =>
{
    var logger = sp.GetRequiredService<ILogger<StockServiceClient>>();
    return PollyExtensions.GetCircuitBreakerPolicy(logger);
});

// Injeção de Dependências dos Serviços
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IAiAuditorService, AiAuditorService>();
builder.Services.AddSingleton<IIdempotencyStore, InMemoryIdempotencyStore>();

// Configuração de Controllers e JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Configuração de CORS para o Frontend Angular
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
builder.Services.AddCommonSwagger("KORP ERP - Billing Service", "v1", "Microsserviço de Gestão de Notas Fiscais e Faturamento com Polly e IA");

var app = builder.Build();

// Middleware Global de Tratamento de Exceções (RFC 7807)
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseCommonSwagger("Billing Service API v1");
}

app.UseAuthorization();
app.MapControllers();

// Inicialização e Seed do Banco de Dados PostgreSQL
await DbInitializer.InitializeAsync(app.Services);

app.Run();
