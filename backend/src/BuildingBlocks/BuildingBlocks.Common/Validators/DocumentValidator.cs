using System.Text.RegularExpressions;

namespace BuildingBlocks.Common.Validators;

public static class DocumentValidator
{
    public static bool IsValidDocument(string? document)
    {
        if (string.IsNullOrWhiteSpace(document))
            return true; // Documento opcional

        var clean = Regex.Replace(document, @"[^\d]", "");

        if (clean.Length == 11)
            return IsValidCpf(clean);

        if (clean.Length == 14)
            return IsValidCnpj(clean);

        return false;
    }

    public static bool IsValidCpf(string cpf)
    {
        var clean = Regex.Replace(cpf, @"[^\d]", "");

        if (clean.Length != 11)
            return false;

        // Rejeita sequências com todos os dígitos iguais (ex: 111.111.111-11)
        if (new string(clean[0], 11) == clean)
            return false;

        // Cálculo do 1º Dígito Verificador
        int[] multiplicadores1 = { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
        int soma1 = 0;
        for (int i = 0; i < 9; i++)
            soma1 += (clean[i] - '0') * multiplicadores1[i];

        int resto1 = soma1 % 11;
        int digito1 = resto1 < 2 ? 0 : 11 - resto1;

        if (clean[9] - '0' != digito1)
            return false;

        // Cálculo do 2º Dígito Verificador
        int[] multiplicadores2 = { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };
        int soma2 = 0;
        for (int i = 0; i < 10; i++)
            soma2 += (clean[i] - '0') * multiplicadores2[i];

        int resto2 = soma2 % 11;
        int digito2 = resto2 < 2 ? 0 : 11 - resto2;

        return clean[10] - '0' == digito2;
    }

    public static bool IsValidCnpj(string cnpj)
    {
        var clean = Regex.Replace(cnpj, @"[^\d]", "");

        if (clean.Length != 14)
            return false;

        // Rejeita sequências com todos os dígitos iguais
        if (new string(clean[0], 14) == clean)
            return false;

        // Cálculo do 1º Dígito Verificador
        int[] multiplicadores1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int soma1 = 0;
        for (int i = 0; i < 12; i++)
            soma1 += (clean[i] - '0') * multiplicadores1[i];

        int resto1 = soma1 % 11;
        int digito1 = resto1 < 2 ? 0 : 11 - resto1;

        if (clean[12] - '0' != digito1)
            return false;

        // Cálculo do 2º Dígito Verificador
        int[] multiplicadores2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int soma2 = 0;
        for (int i = 0; i < 13; i++)
            soma2 += (clean[i] - '0') * multiplicadores2[i];

        int resto2 = soma2 % 11;
        int digito2 = resto2 < 2 ? 0 : 11 - resto2;

        return clean[13] - '0' == digito2;
    }
}
