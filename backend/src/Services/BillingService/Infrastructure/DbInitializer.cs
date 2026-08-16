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
                logger.LogInformation("Populando banco de dados de Faturamento com nota fiscal inicial...");

                var sampleItems = new List<InvoiceItem>
                {
                    new InvoiceItem("PROD-001", "Notebook Dell Vostro 15 3520", 1, 3499.00m),
                    new InvoiceItem("PROD-004", "Mouse Sem Fio Logitech MX Master 3S", 1, 599.00m)
                };

                var sampleInvoice = new Invoice("Empresa Alpha Tecnologia Ltda", "12.345.678/0001-90", sampleItems);

                await context.Invoices.AddAsync(sampleInvoice);
                await context.SaveChangesAsync();

                logger.LogInformation("Nota Fiscal inicial Nº {Number} criada com status Aberta.", sampleInvoice.Number);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erro ao inicializar o banco de dados do BillingService.");
        }
    }
}
