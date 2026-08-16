namespace StockService.DTOs;

public record CreateProductDto(
    string Code,
    string Description,
    decimal StockQuantity,
    decimal UnitPrice
);

public record UpdateProductDto(
    string Description,
    decimal StockQuantity,
    decimal UnitPrice
);

public record ProductDto(
    Guid Id,
    string Code,
    string Description,
    decimal StockQuantity,
    decimal UnitPrice,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record DeductStockItemDto(
    string ProductCode,
    decimal Quantity
);

public record DeductStockRequestDto(
    List<DeductStockItemDto> Items
);

public record DeductStockResponseDto(
    bool Success,
    string Message,
    List<ProductDto> UpdatedProducts
);
