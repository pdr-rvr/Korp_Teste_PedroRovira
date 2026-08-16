using BuildingBlocks.Common.Exceptions;

namespace StockService.Domain;

public class Product
{
    public Guid Id { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal StockQuantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public uint Version { get; set; } // Concorrência Otimista (PostgreSQL xmin)
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // EF Core
    private Product() { }

    public Product(string code, string description, decimal initialStock, decimal unitPrice)
    {
        Validate(code, description, initialStock, unitPrice);

        Id = Guid.NewGuid();
        Code = code.Trim().ToUpperInvariant();
        Description = description.Trim();
        StockQuantity = initialStock;
        UnitPrice = unitPrice;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(string description, decimal stockQuantity, decimal unitPrice)
    {
        Validate(Code, description, stockQuantity, unitPrice);

        Description = description.Trim();
        StockQuantity = stockQuantity;
        UnitPrice = unitPrice;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DeductStock(decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new BusinessRuleException($"A quantidade a ser deduzida do produto '{Code}' deve ser maior que zero.");
        }

        if (StockQuantity < quantity)
        {
            throw new BusinessRuleException($"Saldo insuficiente para o produto '{Code} - {Description}'. Saldo disponível: {StockQuantity}, Quantidade solicitada: {quantity}.");
        }

        StockQuantity -= quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddStock(decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new BusinessRuleException("A quantidade adicionada deve ser maior que zero.");
        }

        StockQuantity += quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    private static void Validate(string code, string description, decimal stock, decimal unitPrice)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(code))
        {
            errors.Add(nameof(Code), new[] { "O código do produto é obrigatório." });
        }
        else if (code.Trim().Length > 50)
        {
            errors.Add(nameof(Code), new[] { "O código do produto não pode exceder 50 caracteres." });
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            errors.Add(nameof(Description), new[] { "A descrição do produto é obrigatória." });
        }
        else if (description.Trim().Length > 255)
        {
            errors.Add(nameof(Description), new[] { "A descrição do produto não pode exceder 255 caracteres." });
        }

        if (stock < 0)
        {
            errors.Add(nameof(StockQuantity), new[] { "O saldo em estoque não pode ser negativo." });
        }

        if (unitPrice < 0)
        {
            errors.Add(nameof(UnitPrice), new[] { "O preço unitário não pode ser negativo." });
        }

        if (errors.Any())
        {
            throw new ValidationException(errors);
        }
    }
}
