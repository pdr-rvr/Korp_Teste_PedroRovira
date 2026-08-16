using BuildingBlocks.Common.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using StockService.Domain;
using StockService.DTOs;
using StockService.Infrastructure;
using StockService.Services;
using Xunit;

namespace StockService.Tests;

public class ProductServiceTests
{
    private StockDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<StockDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new StockDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_WhenValidDto_ShouldPersistProduct()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new ProductService(context, NullLogger<ProductService>.Instance);
        var dto = new CreateProductDto("CODE-100", "Monitor Gamer 144Hz", 5, 1200.00m);

        // Act
        var result = await service.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("CODE-100", result.Code);
        Assert.Equal(5, result.StockQuantity);

        var inDb = await context.Products.FirstOrDefaultAsync(p => p.Code == "CODE-100");
        Assert.NotNull(inDb);
    }

    [Fact]
    public async Task CreateAsync_WhenDuplicateCode_ShouldThrowConflictException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        await context.Products.AddAsync(new Product("CODE-100", "Produto Existente", 10, 50m));
        await context.SaveChangesAsync();

        var service = new ProductService(context, NullLogger<ProductService>.Instance);
        var dto = new CreateProductDto("CODE-100", "Novo Produto", 5, 60m);

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => service.CreateAsync(dto));
    }

    [Fact]
    public async Task DeductStockAsync_WhenBalanceAvailable_ShouldDeductCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        await context.Products.AddAsync(new Product("PROD-A", "Item A", 10, 100m));
        await context.Products.AddAsync(new Product("PROD-B", "Item B", 20, 50m));
        await context.SaveChangesAsync();

        var service = new ProductService(context, NullLogger<ProductService>.Instance);
        var request = new DeductStockRequestDto(new List<DeductStockItemDto>
        {
            new("PROD-A", 2),
            new("PROD-B", 5)
        });

        // Act
        var result = await service.DeductStockAsync(request);

        // Assert
        Assert.True(result.Success);
        var prodA = await context.Products.FirstAsync(p => p.Code == "PROD-A");
        var prodB = await context.Products.FirstAsync(p => p.Code == "PROD-B");
        Assert.Equal(8, prodA.StockQuantity);
        Assert.Equal(15, prodB.StockQuantity);
    }

    [Fact]
    public async Task DeductStockAsync_WhenInsufficientStock_ShouldThrowBusinessRuleExceptionAndNotModifyDatabase()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        await context.Products.AddAsync(new Product("PROD-LIMITED", "Item Limitado", 1, 100m));
        await context.SaveChangesAsync();

        var service = new ProductService(context, NullLogger<ProductService>.Instance);
        var request = new DeductStockRequestDto(new List<DeductStockItemDto>
        {
            new("PROD-LIMITED", 2)
        });

        // Act & Assert
        await Assert.ThrowsAsync<BusinessRuleException>(() => service.DeductStockAsync(request));

        var prod = await context.Products.FirstAsync(p => p.Code == "PROD-LIMITED");
        Assert.Equal(1, prod.StockQuantity); // Saldo permanece intacto
    }
}
