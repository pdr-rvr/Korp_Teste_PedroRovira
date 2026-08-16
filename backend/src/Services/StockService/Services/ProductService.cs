using BuildingBlocks.Common.Exceptions;
using BuildingBlocks.Common.Models;
using Microsoft.EntityFrameworkCore;
using StockService.Domain;
using StockService.DTOs;
using StockService.Infrastructure;

namespace StockService.Services;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetAllAsync(string? search, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default);
    Task<ProductDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductDto> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken cancellationToken = default);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto dto, CancellationToken cancellationToken = default);
    Task<DeductStockResponseDto> DeductStockAsync(DeductStockRequestDto request, CancellationToken cancellationToken = default);
}

public class ProductService : IProductService
{
    private readonly StockDbContext _context;
    private readonly ILogger<ProductService> _logger;

    public ProductService(StockDbContext context, ILogger<ProductService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<ProductDto>> GetAllAsync(string? search, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // LINQ: Construção dinâmica de consulta com filtros e projeção
        var query = _context.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim().ToLower();
            query = query.Where(p => p.Code.ToLower().Contains(cleanSearch) || p.Description.ToLower().Contains(cleanSearch));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // LINQ: Paginação e Projeção
        var items = await query
            .OrderBy(p => p.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto(p.Id, p.Code, p.Description, p.StockQuantity, p.UnitPrice, p.CreatedAt, p.UpdatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<ProductDto>(items, totalCount, page, pageSize);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw new NotFoundException("Produto", id);
        }

        return MapToDto(product);
    }

    public async Task<ProductDto> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.Trim().ToUpperInvariant();
        var product = await _context.Products.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == normalizedCode, cancellationToken);

        if (product == null)
        {
            throw new NotFoundException($"Produto com código '{normalizedCode}' não foi encontrado.");
        }

        return MapToDto(product);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedCode = dto.Code.Trim().ToUpperInvariant();

        // LINQ: Validação de unicidade
        var codeExists = await _context.Products.AnyAsync(p => p.Code == normalizedCode, cancellationToken);
        if (codeExists)
        {
            throw new ConflictException($"Já existe um produto cadastrado com o código '{normalizedCode}'.");
        }

        var product = new Product(dto.Code, dto.Description, dto.StockQuantity, dto.UnitPrice);

        await _context.Products.AddAsync(product, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Produto '{Code}' cadastrado com sucesso. Saldo inicial: {Stock}", product.Code, product.StockQuantity);

        return MapToDto(product);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto dto, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw new NotFoundException("Produto", id);
        }

        product.Update(dto.Description, dto.StockQuantity, dto.UnitPrice);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(product);
    }

    public async Task<DeductStockResponseDto> DeductStockAsync(DeductStockRequestDto request, CancellationToken cancellationToken = default)
    {
        if (request.Items == null || !request.Items.Any())
        {
            throw new BusinessRuleException("A requisição de baixa de estoque não contém itens.");
        }

        // Agrupar itens por código caso haja repetições no mesmo lote
        var itemsByCode = request.Items
            .GroupBy(i => i.ProductCode.Trim().ToUpperInvariant())
            .Select(g => new { Code = g.Key, TotalQuantity = g.Sum(x => x.Quantity) })
            .ToList();

        var codes = itemsByCode.Select(i => i.Code).ToList();

        // Carregar entidades para rastreamento no contexto
        var products = await _context.Products
            .Where(p => codes.Contains(p.Code))
            .ToListAsync(cancellationToken);

        // Validar se todos os produtos foram encontrados
        foreach (var item in itemsByCode)
        {
            var product = products.FirstOrDefault(p => p.Code == item.Code);
            if (product == null)
            {
                throw new NotFoundException($"Produto com código '{item.Code}' não foi localizado no estoque.");
            }

            // Executa a regra de negócio da entidade (valida saldo e deduz)
            product.DeductStock(item.TotalQuantity);
        }

        try
        {
            // Salva de forma atômica no banco relacional PostgreSQL
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Baixa de estoque efetuada com sucesso para {Count} produtos.", products.Count);

            var updatedDtos = products.Select(MapToDto).ToList();
            return new DeductStockResponseDto(true, "Baixa de estoque efetuada com sucesso.", updatedDtos);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Conflito de concorrência detectado ao dar baixa de estoque.");
            throw new ConflictException("Ocorreu um conflito de concorrência ao atualizar o saldo dos produtos. Outra transação alterou o estoque simultaneamente. Por favor, tente novamente.");
        }
    }

    private static ProductDto MapToDto(Product p) =>
        new(p.Id, p.Code, p.Description, p.StockQuantity, p.UnitPrice, p.CreatedAt, p.UpdatedAt);
}
