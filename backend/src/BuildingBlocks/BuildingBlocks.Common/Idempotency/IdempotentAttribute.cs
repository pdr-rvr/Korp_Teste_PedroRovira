using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Common.Idempotency;

[AttributeUsage(AttributeTargets.Method)]
public class IdempotentAttribute : Attribute, IAsyncActionFilter
{
    private const string HeaderName = "X-Idempotency-Key";
    private readonly int _ttlSeconds;

    public IdempotentAttribute(int ttlSeconds = 60)
    {
        _ttlSeconds = ttlSeconds;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;
        if (!httpContext.Request.Headers.TryGetValue(HeaderName, out var keyValues) || string.IsNullOrWhiteSpace(keyValues.FirstOrDefault()))
        {
            // Se a chave não for informada, executa normalmente
            await next();
            return;
        }

        var key = keyValues.First()!;
        var store = httpContext.RequestServices.GetRequiredService<IIdempotencyStore>();
        var logger = httpContext.RequestServices.GetService<ILogger<IdempotentAttribute>>();

        // Verificar se já existe resposta salva para esta chave
        var existingRecord = await store.GetAsync(key, httpContext.RequestAborted);
        if (existingRecord != null)
        {
            logger?.LogInformation("Idempotência acionada para a chave '{Key}'. Retornando resposta em cache.", key);
            context.Result = new ContentResult
            {
                StatusCode = existingRecord.StatusCode,
                Content = existingRecord.ResponseBody,
                ContentType = existingRecord.ContentType
            };
            return;
        }

        // Tentar adquirir lock para evitar execuções simultâneas com a mesma chave
        var acquired = await store.TryAcquireLockAsync(key, TimeSpan.FromSeconds(15), httpContext.RequestAborted);
        if (!acquired)
        {
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Requisição em Processamento",
                Detail = "Uma requisição com esta mesma chave de idempotência já está em andamento. Aguarde alguns instantes."
            })
            {
                StatusCode = StatusCodes.Status409Conflict
            };
            return;
        }

        var executedContext = await next();

        // Se a execução foi bem-sucedida (status 2xx ou 3xx), salvar resposta
        if (executedContext.Result is ObjectResult objectResult && objectResult.StatusCode is >= 200 and < 400)
        {
            var responseBody = System.Text.Json.JsonSerializer.Serialize(objectResult.Value);
            await store.SetAsync(key, objectResult.StatusCode.Value, responseBody, "application/json", TimeSpan.FromSeconds(_ttlSeconds), httpContext.RequestAborted);
        }
    }
}
