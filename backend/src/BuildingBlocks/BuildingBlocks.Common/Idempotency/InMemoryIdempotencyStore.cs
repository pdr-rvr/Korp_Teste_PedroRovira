using System.Collections.Concurrent;

namespace BuildingBlocks.Common.Idempotency;

public class InMemoryIdempotencyStore : IIdempotencyStore
{
    private readonly ConcurrentDictionary<string, (IdempotencyRecord Record, DateTime ExpiresAt)> _cache = new();
    private readonly ConcurrentDictionary<string, DateTime> _locks = new();

    public Task<IdempotencyRecord?> GetAsync(string key, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(key, out var entry))
        {
            if (DateTime.UtcNow <= entry.ExpiresAt)
            {
                return Task.FromResult<IdempotencyRecord?>(entry.Record);
            }
            _cache.TryRemove(key, out _);
        }
        return Task.FromResult<IdempotencyRecord?>(null);
    }

    public Task SetAsync(string key, int statusCode, string responseBody, string contentType, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var record = new IdempotencyRecord
        {
            Key = key,
            StatusCode = statusCode,
            ResponseBody = responseBody,
            ContentType = contentType,
            CreatedAt = DateTime.UtcNow
        };

        _cache[key] = (record, DateTime.UtcNow.Add(ttl));
        _locks.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    public Task<bool> TryAcquireLockAsync(string key, TimeSpan lockDuration, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        if (_locks.TryGetValue(key, out var lockExpiry) && now < lockExpiry)
        {
            return Task.FromResult(false);
        }

        _locks[key] = now.Add(lockDuration);
        return Task.FromResult(true);
    }

    public Task ReleaseLockAsync(string key, CancellationToken cancellationToken = default)
    {
        _locks.TryRemove(key, out _);
        return Task.CompletedTask;
    }
}
