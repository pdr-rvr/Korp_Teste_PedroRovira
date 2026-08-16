using BuildingBlocks.Common.Exceptions;
using StockService.Domain;
using Xunit;

namespace StockService.Tests;

public class ProductDomainTests
{
    [Fact]
    public void CreateProduct_WithValidData_ShouldInitializeCorrectly()
    {
        // Act
        var product = new Product("PROD-001", "Notebook Dell Vostro", 10, 3500.00m);

        // Assert
        Assert.NotEqual(Guid.Empty, product.Id);
        Assert.Equal("PROD-001", product.Code);
        Assert.Equal("Notebook Dell Vostro", product.Description);
        Assert.Equal(10, product.StockQuantity);
        Assert.Equal(3500.00m, product.UnitPrice);
    }

    [Theory]
    [InlineData("", "Descrição", 10, 100)]
    [InlineData("   ", "Descrição", 10, 100)]
    [InlineData("PROD-1", "", 10, 100)]
    [InlineData("PROD-1", "Descrição", -1, 100)]
    [InlineData("PROD-1", "Descrição", 10, -50)]
    public void CreateProduct_WithInvalidData_ShouldThrowValidationException(string code, string description, decimal stock, decimal price)
    {
        // Act & Assert
        Assert.Throws<ValidationException>(() => new Product(code, description, stock, price));
    }

    [Fact]
    public void DeductStock_WhenSufficientBalance_ShouldReduceStockQuantity()
    {
        // Arrange
        var product = new Product("PROD-001", "Notebook", 10, 1000m);

        // Act
        product.DeductStock(3);

        // Assert
        Assert.Equal(7, product.StockQuantity);
    }

    [Fact]
    public void DeductStock_WhenInsufficientBalance_ShouldThrowBusinessRuleException()
    {
        // Arrange
        var product = new Product("PROD-001", "Notebook", 2, 1000m);

        // Act & Assert
        var ex = Assert.Throws<BusinessRuleException>(() => product.DeductStock(5));
        Assert.Contains("Saldo insuficiente", ex.Message);
        Assert.Equal(2, product.StockQuantity);
    }

    [Fact]
    public void DeductStock_WhenNegativeOrZeroQuantity_ShouldThrowBusinessRuleException()
    {
        // Arrange
        var product = new Product("PROD-001", "Notebook", 10, 1000m);

        // Act & Assert
        Assert.Throws<BusinessRuleException>(() => product.DeductStock(0));
        Assert.Throws<BusinessRuleException>(() => product.DeductStock(-2));
    }
}
