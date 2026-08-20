using System.Net;
using Polly;
using Polly.Extensions.Http;

namespace BillingService.HttpClients;

public static class PollyExtensions
{
    public static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy(ILogger logger)
    {
        // Política de Retry com Backoff Exponencial + Jitter (1s, 2s, 4s)
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(msg => msg.StatusCode == HttpStatusCode.ServiceUnavailable || msg.StatusCode == HttpStatusCode.GatewayTimeout)
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt =>
                {
                    var baseDelay = TimeSpan.FromSeconds(Math.Pow(2, retryAttempt - 1));
                    var jitter = TimeSpan.FromMilliseconds(Random.Shared.Next(0, 300));
                    return baseDelay + jitter;
                },
                onRetry: (outcome, timespan, retryAttempt, context) =>
                {
                    logger.LogWarning("Polly Retry [{Attempt}/3] acionado após {Delay:F2}s devido a: {Reason}",
                        retryAttempt,
                        timespan.TotalSeconds,
                        outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString());
                });
    }

    public static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy(ILogger logger)
    {
        // Circuit Breaker: Abre o circuito após 3 falhas consecutivas e aguarda 30 segundos
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(msg => msg.StatusCode == HttpStatusCode.ServiceUnavailable)
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 3,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (outcome, timespan) =>
                {
                    logger.LogCritical("Polly Circuit Breaker ABERTO! O StockService está instável. Bloqueando chamadas por {Duration}s.", timespan.TotalSeconds);
                },
                onReset: () =>
                {
                    logger.LogInformation("Polly Circuit Breaker FECHADO. Comunicação com StockService restabelecida.");
                },
                onHalfOpen: () =>
                {
                    logger.LogWarning("Polly Circuit Breaker MEIO-ABERTO. Testando requisição de sondagem no StockService...");
                });
    }
}
