using BillingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace BillingService.Infrastructure;

public class BillingDbContext : DbContext
{
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();

    public BillingDbContext(DbContextOptions<BillingDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Sequence do PostgreSQL para numeração atômica e estritamente crescente
        modelBuilder.HasSequence<long>("InvoiceNumberSequence")
            .StartsAt(1001)
            .IncrementsBy(1);

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.ToTable("Invoices");
            entity.HasKey(i => i.Id);

            entity.Property(i => i.Number)
                .HasDefaultValueSql("nextval('\"InvoiceNumberSequence\"')")
                .IsRequired();

            entity.HasIndex(i => i.Number)
                .IsUnique();

            entity.Property(i => i.CustomerName)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(i => i.CustomerDocument)
                .HasMaxLength(30);

            entity.Property(i => i.Status)
                .IsRequired()
                .HasConversion<int>();

            entity.HasMany(i => i.Items)
                .WithOne()
                .HasForeignKey(item => item.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.ToTable("InvoiceItems");
            entity.HasKey(item => item.Id);

            entity.Property(item => item.ProductCode)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(item => item.ProductDescription)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(item => item.Quantity)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(item => item.UnitPrice)
                .HasPrecision(18, 2)
                .IsRequired();
        });
    }
}
