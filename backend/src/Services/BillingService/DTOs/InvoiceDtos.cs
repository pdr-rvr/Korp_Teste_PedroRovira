using BillingService.Domain;

namespace BillingService.DTOs;

public record CreateInvoiceItemDto(
    string ProductCode,
    string ProductDescription,
    decimal Quantity,
    decimal UnitPrice
);

public record CreateInvoiceDto(
    string CustomerName,
    string? CustomerDocument,
    List<CreateInvoiceItemDto> Items
);

public record InvoiceItemDto(
    Guid Id,
    string ProductCode,
    string ProductDescription,
    decimal Quantity,
    decimal UnitPrice,
    decimal Subtotal
);

public record InvoiceDto(
    Guid Id,
    long Number,
    DateTime IssueDate,
    InvoiceStatus Status,
    string StatusDescription,
    string CustomerName,
    string CustomerDocument,
    decimal TotalAmount,
    DateTime? IssuedAt,
    DateTime CreatedAt,
    List<InvoiceItemDto> Items
);

public record IssueInvoiceResponseDto(
    bool Success,
    string Message,
    InvoiceDto Invoice
);

public record StockProductDto(
    Guid Id,
    string Code,
    string Description,
    decimal StockQuantity,
    decimal UnitPrice
);

public record DeductStockItemRequest(
    string ProductCode,
    decimal Quantity
);

public record DeductStockApiRequest(
    List<DeductStockItemRequest> Items
);

public record DeductStockApiResponse(
    bool Success,
    string Message
);

public record AiAuditReportDto(
    string Summary,
    List<string> FiscalAlerts,
    List<string> InventoryInsights,
    List<string> Recommendations,
    DateTime AnalyzedAt
);
