using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StockService.Domain;

namespace StockService.Infrastructure;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<StockDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<StockDbContext>>();

        try
        {
            // Aplica migrações ou cria banco se não existir
            await context.Database.EnsureCreatedAsync();

            if (!await context.Products.AnyAsync())
            {
                logger.LogInformation("Populando banco de dados de Estoque com produtos iniciais de exemplo...");

                var initialProducts = new List<Product>
                {
                    new Product("PROD-001", "Notebook Dell Vostro 15 3520 (Intel i5, 16GB RAM)", 15, 3499.00m),
                    new Product("PROD-002", "Monitor LG UltraWide 29\" IPS Full HD", 8, 1150.00m),
                    new Product("PROD-003", "Teclado Mecânico Logitech G Pro Switch GX Blue", 25, 489.90m),
                    new Product("PROD-004", "Mouse Sem Fio Logitech MX Master 3S", 12, 599.00m),
                    new Product("PROD-005", "Item Limitado para Teste de Concorrência", 1, 99.00m) // Produto com saldo 1 exigido no teste!
                };

                await context.Products.AddRangeAsync(initialProducts);
                await context.SaveChangesAsync();

                logger.LogInformation("Produtos iniciais cadastrados com sucesso.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erro ao inicializar o banco de dados do StockService.");
        }
    }
}
