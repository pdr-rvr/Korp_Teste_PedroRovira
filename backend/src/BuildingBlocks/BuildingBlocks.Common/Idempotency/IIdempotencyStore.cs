namespace BuildingBlocks.Common.Idempotency;

public class IdempotencyRecord
{
    public string Key { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string ResponseBody { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/json";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public interface IIdempotencyStore
{
    Task<IdempotencyRecord?> GetAsync(string key, CancellationToken cancellationToken = default);
    Task SetAsync(string key, int statusCode, string responseBody, string contentType, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration, CancellationToken cancellationToken = default);
    Task ReleaseLockAsync(string key, CancellationToken cancellationToken = default);
}
