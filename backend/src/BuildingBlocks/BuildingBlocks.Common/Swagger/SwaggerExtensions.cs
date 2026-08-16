using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;

namespace BuildingBlocks.Common.Swagger;

public static class SwaggerExtensions
{
    public static IServiceCollection AddCommonSwagger(this IServiceCollection services, string title, string version = "v1", string description = "")
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc(version, new OpenApiInfo
            {
                Title = title,
                Version = version,
                Description = description
            });

            // Suporte para o cabeçalho X-Idempotency-Key no Swagger
            c.AddSecurityDefinition("X-Idempotency-Key", new OpenApiSecurityScheme
            {
                Name = "X-Idempotency-Key",
                Type = SecuritySchemeType.ApiKey,
                In = ParameterLocation.Header,
                Description = "Chave única de idempotência para evitar operações duplicadas (ex: UUID v4)"
            });
        });

        return services;
    }

    public static IApplicationBuilder UseCommonSwagger(this IApplicationBuilder app, string endpointName)
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", endpointName);
            c.RoutePrefix = string.Empty; // Serve o Swagger na raiz do serviço
        });

        return app;
    }
}
