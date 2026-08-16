using System.Net;
using System.Text.Json;
using BuildingBlocks.Common.Exceptions;
using BillingService.DTOs;

namespace BillingService.HttpClients;

public class StockServiceClient : IStockServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<StockServiceClient> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public StockServiceClient(HttpClient httpClient, ILogger<StockServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<StockProductDto?> GetProductByCodeAsync(string productCode, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"api/products/by-code/{Uri.EscapeDataString(productCode)}", cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            return JsonSerializer.Deserialize<StockProductDto>(content, JsonOptions);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Erro de comunicação ao consultar produto '{ProductCode}' no StockService.", productCode);
            throw new BusinessRuleException($"Não foi possível consultar o produto '{productCode}' no serviço de estoque devido a uma instabilidade temporária. Detalhes: {ex.Message}");
        }
    }

    public async Task<bool> DeductStockAsync(List<DeductStockItemRequest> items, CancellationToken cancellationToken = default)
    {
        var requestPayload = new DeductStockApiRequest(items);
        var content = new StringContent(JsonSerializer.Serialize(requestPayload), System.Text.Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync("api/products/deduct", content, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Baixa de estoque confirmada pelo StockService para {Count} itens.", items.Count);
                return true;
            }

            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("StockService respondeu com erro [{StatusCode}]: {ErrorBody}", response.StatusCode, errorBody);

            string errorMessage = "Falha ao realizar baixa no estoque.";
            try
            {
                using var doc = JsonDocument.Parse(errorBody);
                if (doc.RootElement.TryGetProperty("detail", out var detailProp))
                {
                    errorMessage = detailProp.GetString() ?? errorMessage;
                }
                else if (doc.RootElement.TryGetProperty("message", out var msgProp))
                {
                    errorMessage = msgProp.GetString() ?? errorMessage;
                }
            }
            catch
            {
                if (!string.IsNullOrWhiteSpace(errorBody))
                {
                    errorMessage = errorBody;
                }
            }

            if (response.StatusCode == HttpStatusCode.Conflict || response.StatusCode == HttpStatusCode.BadRequest)
            {
                throw new BusinessRuleException(errorMessage);
            }

            if (response.StatusCode == HttpStatusCode.ServiceUnavailable)
            {
                throw new ServiceUnavailableException("O microsserviço de Estoque está temporariamente indisponível (HTTP 503 / Simulação de Falha). O Polly executou as tentativas de retry com backoff exponencial e interrompeu a chamada com segurança, mantendo a integridade transacional.");
            }

            throw new BusinessRuleException($"O serviço de estoque retornou erro {(int)response.StatusCode}: {errorMessage}");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Falha de rede/resiliência ao conectar com o StockService para baixa de estoque.");
            throw new ServiceUnavailableException("Não foi possível conectar ao microsserviço de Estoque após as tentativas de retry do Polly. A operação foi cancelada com segurança e nenhum saldo foi debitado incorretamente.");
        }
    }
}
