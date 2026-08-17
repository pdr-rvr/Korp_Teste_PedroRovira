using BuildingBlocks.Common.Exceptions;
using BillingService.Domain;
using Xunit;

namespace BillingService.Tests;

public class InvoiceDomainTests
{
    [Fact]
    public void CreateInvoice_WithValidData_ShouldInitializeWithOpenStatusAndCorrectTotals()
    {
        // Arrange (CNPJ válido: 33.000.167/0001-01)
        var items = new List<InvoiceItem>
        {
            new("PROD-1", "Notebook", 2, 3000.00m), // 6000
            new("PROD-2", "Mouse", 3, 100.00m)      // 300
        };

        // Act
        var invoice = new Invoice("Empresa Teste", "33.000.167/0001-01", items);

        // Assert
        Assert.NotEqual(Guid.Empty, invoice.Id);
        Assert.Equal(InvoiceStatus.Aberta, invoice.Status);
        Assert.Equal("Empresa Teste", invoice.CustomerName);
        Assert.Equal(2, invoice.Items.Count);
        Assert.Equal(6300.00m, invoice.TotalAmount);
        Assert.Null(invoice.IssuedAt);
    }

    [Fact]
    public void CreateInvoice_WithoutItems_ShouldThrowValidationException()
    {
        // Act & Assert
        Assert.Throws<ValidationException>(() => new Invoice("Cliente", "33.000.167/0001-01", new List<InvoiceItem>()));
    }

    [Fact]
    public void CreateInvoice_WithEmptyCustomerName_ShouldThrowValidationException()
    {
        var items = new List<InvoiceItem> { new("PROD-1", "Item", 1, 50m) };
        Assert.Throws<ValidationException>(() => new Invoice("", "33.000.167/0001-01", items));
    }

    [Fact]
    public void CreateInvoice_WithInvalidCpf_ShouldThrowValidationException()
    {
        // Arrange
        var items = new List<InvoiceItem> { new("PROD-1", "Item", 1, 50m) };

        // Act & Assert (CPF com dígitos repetidos)
        Assert.Throws<ValidationException>(() => new Invoice("Cliente", "111.111.111-11", items));
        // CPF com tamanho ou dígito verificador incorreto
        Assert.Throws<ValidationException>(() => new Invoice("Cliente", "123.456.789-00", items));
    }

    [Fact]
    public void CreateInvoice_WithValidCpfOrCnpj_ShouldSucceed()
    {
        // Arrange
        var items = new List<InvoiceItem> { new("PROD-1", "Item", 1, 50m) };

        // Act & Assert (CNPJ válido padrão Viasoft/Petrobras)
        var invoice = new Invoice("Cliente", "33.000.167/0001-01", items);
        Assert.NotNull(invoice);
    }

    [Fact]
    public void CloseAndIssue_WhenOpen_ShouldTransitionToClosedAndSetIssuedDate()
    {
        // Arrange
        var items = new List<InvoiceItem> { new("PROD-1", "Item", 1, 50m) };
        var invoice = new Invoice("Cliente", "33.000.167/0001-01", items);

        // Act
        invoice.CloseAndIssue();

        // Assert
        Assert.Equal(InvoiceStatus.Fechada, invoice.Status);
        Assert.NotNull(invoice.IssuedAt);
    }

    [Fact]
    public void CloseAndIssue_WhenAlreadyClosed_ShouldThrowBusinessRuleException()
    {
        // Arrange
        var items = new List<InvoiceItem> { new("PROD-1", "Item", 1, 50m) };
        var invoice = new Invoice("Cliente", "33.000.167/0001-01", items);
        invoice.CloseAndIssue(); // Primeira emissão

        // Act & Assert
        var ex = Assert.Throws<BusinessRuleException>(() => invoice.CloseAndIssue());
        Assert.Contains("já está FECHADA", ex.Message);
    }
}
