using BuildingBlocks.Common.Validators;
using Xunit;

namespace BillingService.Tests;

public class DocumentValidatorTests
{
    [Theory]
    [InlineData("11.222.333/0001-81", true)]
    [InlineData("33.000.167/0001-01", true)] // Petrobras
    [InlineData("53.113.791/0001-22", true)] // TOTVS
    [InlineData("07.526.557/0001-00", true)] // Ambev
    [InlineData("04.252.011/0001-10", true)] // Korp
    [InlineData("12.345.678/0001-95", true)]
    [InlineData("12.345.678/0001-00", false)] // Dígitos inválidos
    [InlineData("11.111.111/1111-11", false)] // Dígitos repetidos
    [InlineData("00.000.000/0000-00", false)] // Dígitos repetidos
    [InlineData("123", false)]                // Tamanho inválido
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsValidCnpj_ShouldValidateCorrectly(string? cnpj, bool expected)
    {
        var result = DocumentValidator.IsValidCnpj(cnpj ?? string.Empty);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("111.111.111-11", false)] // Repetido
    [InlineData("222.222.222-22", false)] // Repetido
    [InlineData("123.456.789-00", false)] // Dígito inválido
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsValidCpf_ShouldValidateCorrectly(string? cpf, bool expected)
    {
        var result = DocumentValidator.IsValidCpf(cpf ?? string.Empty);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("33.000.167/0001-01", true)]
    [InlineData("111.111.111-11", false)]
    [InlineData("12.345.678/0001-00", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsValidDocument_ShouldValidateAnyDocument(string? doc, bool expected)
    {
        var result = DocumentValidator.IsValidDocument(doc);
        Assert.Equal(expected, result);
    }
}
