using BuildingBlocks.Common.Exceptions;
using BillingService.Domain;
using BillingService.DTOs;
using BillingService.HttpClients;
using BillingService.Infrastructure;
using BillingService.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace BillingService.Tests;

public class MockStockServiceClient : IStockServiceClient
{
    public bool ShouldFail { get; set; } = false;
    public bool DeductCalled { get; private set; } = false;

    public Task<StockProductDto?> GetProductByCodeAsync(string productCode, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<StockProductDto?>(new StockProductDto(Guid.NewGuid(), productCode, "Produto Teste", 10, 100m));
    }

    public Task<bool> DeductStockAsync(List<DeductStockItemRequest> items, CancellationToken cancellationToken = default)
    {
        DeductCalled = true;
        if (ShouldFail)
        {
            throw new BusinessRuleException("Saldo insuficiente no estoque para atender aos itens da nota.");
        }
        return Task.FromResult(true);
    }
}

public class InvoiceServiceTests
{
    private BillingDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<BillingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new BillingDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_WhenValidDto_ShouldPersistOpenInvoice()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var mockStock = new MockStockServiceClient();
        var service = new InvoiceService(context, mockStock, NullLogger<InvoiceService>.Instance);

        var dto = new CreateInvoiceDto(
            "Empresa Beta Tech",
            "98.765.432/0001-11",
            new List<CreateInvoiceItemDto>
            {
                new("PROD-001", "Notebook", 1, 3500m),
                new("PROD-002", "Monitor", 2, 1000m)
            }
        );

        // Act
        var result = await service.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Empresa Beta Tech", result.CustomerName);
        Assert.Equal(InvoiceStatus.Aberta, result.Status);
        Assert.Equal(5500m, result.TotalAmount);
        Assert.Equal(2, result.Items.Count);
    }

    [Fact]
    public async Task IssueInvoiceAsync_WhenOpen_ShouldCallStockAndCloseInvoice()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var mockStock = new MockStockServiceClient();
        var service = new InvoiceService(context, mockStock, NullLogger<InvoiceService>.Instance);

        var items = new List<InvoiceItem> { new("PROD-001", "Notebook", 1, 3500m) };
        var invoice = new Invoice("Cliente Teste", "123", items);
        await context.Invoices.AddAsync(invoice);
        await context.SaveChangesAsync();

        // Act
        var result = await service.IssueInvoiceAsync(invoice.Id);

        // Assert
        Assert.True(result.Success);
        Assert.True(mockStock.DeductCalled);

        var updated = await context.Invoices.FirstAsync(i => i.Id == invoice.Id);
        Assert.Equal(InvoiceStatus.Fechada, updated.Status);
        Assert.NotNull(updated.IssuedAt);
    }

    [Fact]
    public async Task IssueInvoiceAsync_WhenStockDeductionFails_ShouldKeepInvoiceOpen()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var mockStock = new MockStockServiceClient { ShouldFail = true };
        var service = new InvoiceService(context, mockStock, NullLogger<InvoiceService>.Instance);

        var items = new List<InvoiceItem> { new("PROD-001", "Notebook", 10, 3500m) };
        var invoice = new Invoice("Cliente Teste", "123", items);
        await context.Invoices.AddAsync(invoice);
        await context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<BusinessRuleException>(() => service.IssueInvoiceAsync(invoice.Id));

        var notUpdated = await context.Invoices.FirstAsync(i => i.Id == invoice.Id);
        Assert.Equal(InvoiceStatus.Aberta, notUpdated.Status); // Permanece aberta
        Assert.Null(notUpdated.IssuedAt);
    }
}
