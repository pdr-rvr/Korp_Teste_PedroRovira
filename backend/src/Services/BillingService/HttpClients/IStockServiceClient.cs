using BillingService.DTOs;

namespace BillingService.HttpClients;

public interface IStockServiceClient
{
    Task<StockProductDto?> GetProductByCodeAsync(string productCode, CancellationToken cancellationToken = default);
    Task<bool> DeductStockAsync(List<DeductStockItemRequest> items, CancellationToken cancellationToken = default);
}
