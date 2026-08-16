using BuildingBlocks.Common.Exceptions;
using BuildingBlocks.Common.Models;
using BillingService.Domain;
using BillingService.DTOs;
using BillingService.HttpClients;
using BillingService.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace BillingService.Services;

public interface IInvoiceService
{
    Task<PagedResult<InvoiceDto>> GetAllAsync(InvoiceStatus? status, string? search, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default);
    Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto, CancellationToken cancellationToken = default);
    Task<IssueInvoiceResponseDto> IssueInvoiceAsync(Guid id, CancellationToken cancellationToken = default);
}

public class InvoiceService : IInvoiceService
{
    private readonly BillingDbContext _context;
    private readonly IStockServiceClient _stockClient;
    private readonly ILogger<InvoiceService> _logger;

    public InvoiceService(BillingDbContext context, IStockServiceClient stockClient, ILogger<InvoiceService> logger)
    {
        _context = context;
        _stockClient = stockClient;
        _logger = logger;
    }

    public async Task<PagedResult<InvoiceDto>> GetAllAsync(InvoiceStatus? status, string? search, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // LINQ: Consulta dinâmica com filtros e ordenação
        var query = _context.Invoices
            .Include(i => i.Items)
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(i => i.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim().ToLower();
            query = query.Where(i =>
                i.CustomerName.ToLower().Contains(cleanSearch) ||
                i.CustomerDocument.ToLower().Contains(cleanSearch) ||
                i.Number.ToString().Contains(cleanSearch));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // LINQ: Projeção de dados
        var items = await query
            .OrderByDescending(i => i.Number)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToDto).ToList();
        return new PagedResult<InvoiceDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<InvoiceDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // LINQ: Include para carregar itens filhos agregados
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (invoice == null)
        {
            throw new NotFoundException("Nota Fiscal", id);
        }

        return MapToDto(invoice);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.Items == null || !dto.Items.Any())
        {
            throw new ValidationException("Items", "A nota fiscal deve conter pelo menos um item.");
        }

        var domainItems = dto.Items.Select(item =>
            new InvoiceItem(item.ProductCode, item.ProductDescription, item.Quantity, item.UnitPrice)
        ).ToList();

        var invoice = new Invoice(dto.CustomerName, dto.CustomerDocument, domainItems);

        await _context.Invoices.AddAsync(invoice, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Nota Fiscal Nº {Number} criada com sucesso com {ItemCount} itens e status ABERTA.",
            invoice.Number, invoice.Items.Count);

        return MapToDto(invoice);
    }

    public async Task<IssueInvoiceResponseDto> IssueInvoiceAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (invoice == null)
        {
            throw new NotFoundException("Nota Fiscal", id);
        }

        // Regra de Negócio: Não permitir a impressão de notas com status diferente de Aberta
        if (invoice.Status != InvoiceStatus.Aberta)
        {
            throw new BusinessRuleException($"Não é possível emitir a Nota Fiscal Nº {invoice.Number}. Apenas notas com status 'Aberta' podem ser emitidas.");
        }

        _logger.LogInformation("Iniciando processo de emissão/impressão da Nota Fiscal Nº {Number}...", invoice.Number);

        // Montar requisição de baixa de estoque para todos os itens da nota
        var deductItems = invoice.Items
            .Select(i => new DeductStockItemRequest(i.ProductCode, i.Quantity))
            .ToList();

        // 1. Chamada HTTP com resiliência Polly para o StockService
        await _stockClient.DeductStockAsync(deductItems, cancellationToken);

        // 2. Transição atômica de status para Fechada
        invoice.CloseAndIssue();

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Nota Fiscal Nº {Number} emitida e FECHADA com sucesso.", invoice.Number);

        return new IssueInvoiceResponseDto(
            true,
            $"Nota Fiscal Nº {invoice.Number} emitida com sucesso! O estoque dos produtos foi atualizado e o status foi alterado para Fechada.",
            MapToDto(invoice)
        );
    }

    private static InvoiceDto MapToDto(Invoice i) =>
        new(
            i.Id,
            i.Number,
            i.IssueDate,
            i.Status,
            i.Status.ToString(),
            i.CustomerName,
            i.CustomerDocument,
            i.TotalAmount,
            i.IssuedAt,
            i.CreatedAt,
            i.Items.Select(item => new InvoiceItemDto(
                item.Id,
                item.ProductCode,
                item.ProductDescription,
                item.Quantity,
                item.UnitPrice,
                item.Subtotal
            )).ToList()
        );
}
