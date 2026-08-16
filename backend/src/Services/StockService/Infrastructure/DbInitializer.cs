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
            await context.Database.EnsureCreatedAsync();

            if (!await context.Products.AnyAsync())
            {
                logger.LogInformation("Populando banco de dados de Estoque com dataset corporativo...");
                await SeedProductsAsync(context);
                logger.LogInformation("Dataset corporativo de produtos cadastrado com sucesso.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erro ao inicializar o banco de dados do StockService.");
        }
    }

    public static async Task ResetAndSeedAsync(StockDbContext context)
    {
        context.Products.RemoveRange(context.Products);
        await context.SaveChangesAsync();
        await SeedProductsAsync(context);
    }

    private static async Task SeedProductsAsync(StockDbContext context)
    {
        var initialProducts = new List<Product>
        {
            new Product("PROD-001", "Notebook Corporativo Dell Latitude 5440 (Intel Core i7, 32GB RAM, SSD 1TB NVMe)", 20, 5490.00m),
            new Product("PROD-002", "Monitor Profissional Dell UltraSharp 27\" 4K USB-C Hub (U2723QE)", 14, 3890.00m),
            new Product("PROD-003", "Servidor Rack Dell PowerEdge R450 (Xeon Silver 4314, 64GB ECC, 2x 960GB SSD)", 4, 24500.00m),
            new Product("PROD-004", "Switch Gerenciável Cisco Catalyst 1000 24 Portas Gigabit PoE+", 8, 4250.00m),
            new Product("PROD-005", "Roteador Cisco Meraki MX68 Cloud Managed Security Appliance (Item para Teste de Concorrência)", 1, 6800.00m),
            new Product("PROD-006", "Teclado e Mouse Sem Fio Logitech MX Keys Combo for Business", 30, 899.00m),
            new Product("PROD-007", "Nobreak Senoidal APC Smart-UPS 2200VA 120V/230V com Painel LCD", 6, 5120.00m),
            new Product("PROD-008", "Licença Anual Microsoft 365 Business Premium Corporativa", 50, 1380.00m)
        };

        await context.Products.AddRangeAsync(initialProducts);
        await context.SaveChangesAsync();
    }
}
