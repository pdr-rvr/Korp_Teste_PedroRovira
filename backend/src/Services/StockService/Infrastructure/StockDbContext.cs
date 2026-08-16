using Microsoft.EntityFrameworkCore;
using StockService.Domain;

namespace StockService.Infrastructure;

public class StockDbContext : DbContext
{
    public DbSet<Product> Products => Set<Product>();

    public StockDbContext(DbContextOptions<StockDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Code)
                .IsRequired()
                .HasMaxLength(50);

            entity.HasIndex(p => p.Code)
                .IsUnique();

            entity.Property(p => p.Description)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(p => p.StockQuantity)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(p => p.UnitPrice)
                .HasPrecision(18, 2)
                .IsRequired();

            // Configuração de Concorrência Otimista padrão do EF Core
            entity.Property(p => p.Version)
                .IsRowVersion();
        });
    }
}
