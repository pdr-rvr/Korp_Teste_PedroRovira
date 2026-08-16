using BuildingBlocks.Common.Exceptions;

namespace BillingService.Domain;

public class Invoice
{
    public Guid Id { get; private set; }
    public long Number { get; private set; } // Sequence do PostgreSQL
    public DateTime IssueDate { get; private set; }
    public InvoiceStatus Status { get; private set; }
    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerDocument { get; private set; } = string.Empty;
    public decimal TotalAmount => _items.Sum(i => i.Subtotal);
    public DateTime? IssuedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private readonly List<InvoiceItem> _items = new();
    public IReadOnlyCollection<InvoiceItem> Items => _items.AsReadOnly();

    // EF Core
    private Invoice() { }

    public Invoice(string customerName, string? customerDocument, IEnumerable<InvoiceItem> items)
    {
        if (string.IsNullOrWhiteSpace(customerName))
            throw new ValidationException(nameof(CustomerName), "O nome do cliente/destinatário é obrigatório.");

        if (!string.IsNullOrWhiteSpace(customerDocument) && !BuildingBlocks.Common.Validators.DocumentValidator.IsValidDocument(customerDocument))
        {
            throw new ValidationException(nameof(CustomerDocument), "O CPF ou CNPJ informado para o cliente é inválido.");
        }

        var itemList = items?.ToList() ?? new List<InvoiceItem>();
        if (!itemList.Any())
            throw new ValidationException("Items", "A nota fiscal deve conter pelo menos um produto/item.");

        Id = Guid.NewGuid();
        CustomerName = customerName.Trim();
        CustomerDocument = customerDocument?.Trim() ?? string.Empty;
        Status = InvoiceStatus.Aberta;
        IssueDate = DateTime.UtcNow;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;

        _items.AddRange(itemList);
    }

    public void CloseAndIssue()
    {
        if (Status == InvoiceStatus.Fechada)
        {
            throw new BusinessRuleException($"A Nota Fiscal Nº {Number} já está FECHADA e não pode ser impressa/emitida novamente.");
        }

        Status = InvoiceStatus.Fechada;
        IssuedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
