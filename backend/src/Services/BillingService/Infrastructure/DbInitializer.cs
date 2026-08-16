using BillingService.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BillingService.Infrastructure;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BillingDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<BillingDbContext>>();

        try
        {
            await context.Database.EnsureCreatedAsync();

            if (!await context.Invoices.AnyAsync())
            {
                logger.LogInformation("Populando banco de dados de Faturamento com dataset corporativo de notas fiscais...");
                await SeedInvoicesAsync(context);
                logger.LogInformation("Dataset corporativo de notas fiscais cadastrado com sucesso.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erro ao inicializar o banco de dados do BillingService.");
        }
    }

    public static async Task ResetAndSeedAsync(BillingDbContext context)
    {
        context.InvoiceItems.RemoveRange(context.InvoiceItems);
        context.Invoices.RemoveRange(context.Invoices);
        await context.SaveChangesAsync();
        await SeedInvoicesAsync(context);
    }

    private static async Task SeedInvoicesAsync(BillingDbContext context)
    {
        // 1. Nota Fechada - Viasoft Informática (CNPJ Válido: 33.000.167/0001-01)
        var inv1Items = new List<InvoiceItem>
        {
            new InvoiceItem("PROD-001", "Notebook Corporativo Dell Latitude 5440", 2, 5490.00m),
            new InvoiceItem("PROD-002", "Monitor Profissional Dell UltraSharp 27\" 4K", 2, 3890.00m)
        };
        var inv1 = new Invoice("Viasoft Informática e Gestão Empresarial Ltda", "33.000.167/0001-01", inv1Items);
        inv1.CloseAndIssue();

        // 2. Nota Fechada - TechSolutions Brasil (CNPJ Válido: 53.113.791/0001-22)
        var inv2Items = new List<InvoiceItem>
        {
            new InvoiceItem("PROD-003", "Servidor Rack Dell PowerEdge R450", 1, 24500.00m),
            new InvoiceItem("PROD-004", "Switch Gerenciável Cisco Catalyst 1000", 1, 4250.00m)
        };
        var inv2 = new Invoice("TechSolutions Brasil Inovação Digital S/A", "53.113.791/0001-22", inv2Items);
        inv2.CloseAndIssue();

        // 3. Nota Aberta - Alpha Consultoria (CNPJ Válido: 07.526.557/0001-00)
        var inv3Items = new List<InvoiceItem>
        {
            new InvoiceItem("PROD-006", "Teclado e Mouse Sem Fio Logitech MX Keys Combo", 3, 899.00m),
            new InvoiceItem("PROD-007", "Nobreak Senoidal APC Smart-UPS 2200VA", 1, 5120.00m)
        };
        var inv3 = new Invoice("Alpha Consultoria em Engenharia de Software Ltda", "07.526.557/0001-00", inv3Items);

        // 4. Nota Aberta - Nexus Data Analytics (CNPJ Válido: 00.000.000/0001-91)
        var inv4Items = new List<InvoiceItem>
        {
            new InvoiceItem("PROD-001", "Notebook Corporativo Dell Latitude 5440", 1, 5490.00m),
            new InvoiceItem("PROD-008", "Licença Anual Microsoft 365 Business Premium", 5, 1380.00m)
        };
        var inv4 = new Invoice("Nexus Data Analytics & Inteligência Fiscal S/A", "00.000.000/0001-91", inv4Items);

        // 5. Nota Aberta - Korp Indústria e Logística (CNPJ Válido: 12.345.678/0001-95)
        var inv5Items = new List<InvoiceItem>
        {
            new InvoiceItem("PROD-002", "Monitor Profissional Dell UltraSharp 27\" 4K", 1, 3890.00m)
        };
        var inv5 = new Invoice("Korp Indústria e Logística Integrada S/A", "12.345.678/0001-95", inv5Items);

        await context.Invoices.AddRangeAsync(new[] { inv1, inv2, inv3, inv4, inv5 });
        await context.SaveChangesAsync();
    }
}
