using BuildingBlocks.Common.Exceptions;

namespace BillingService.Domain;

public class InvoiceItem
{
    public Guid Id { get; private set; }
    public Guid InvoiceId { get; private set; }
    public string ProductCode { get; private set; } = string.Empty;
    public string ProductDescription { get; private set; } = string.Empty;
    public decimal Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal Subtotal => Quantity * UnitPrice;

    // EF Core
    private InvoiceItem() { }

    public InvoiceItem(string productCode, string productDescription, decimal quantity, decimal unitPrice)
    {
        if (string.IsNullOrWhiteSpace(productCode))
            throw new ValidationException(nameof(ProductCode), "O código do produto é obrigatório.");

        if (string.IsNullOrWhiteSpace(productDescription))
            throw new ValidationException(nameof(ProductDescription), "A descrição do produto é obrigatória.");

        if (quantity <= 0)
            throw new ValidationException(nameof(Quantity), "A quantidade deve ser maior que zero.");

        if (unitPrice < 0)
            throw new ValidationException(nameof(UnitPrice), "O preço unitário não pode ser negativo.");

        Id = Guid.NewGuid();
        ProductCode = productCode.Trim().ToUpperInvariant();
        ProductDescription = productDescription.Trim();
        Quantity = quantity;
        UnitPrice = unitPrice;
    }
}
