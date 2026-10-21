package com.securevault.backend.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

@Service
public class CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheService.class);

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    // In-memory local fallback cache when Redis server is offline / unavailable
    private final ConcurrentHashMap<String, CacheEntry> localFallbackCache = new ConcurrentHashMap<>();

    private record CacheEntry(Object value, long expiresAt) {
        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    public <T> T getOrCompute(String key, Duration ttl, Supplier<T> computer) {
        // 1. Try to read from Redis
        if (redisTemplate != null) {
            try {
                Object cached = redisTemplate.opsForValue().get(key);
                if (cached != null) {
                    log.info("[REDIS CACHE HIT] Key: {}", key);
                    @SuppressWarnings("unchecked")
                    T typed = (T) cached;
                    return typed;
                }
                log.info("[REDIS CACHE MISS] Key: {}", key);
            } catch (Exception e) {
                log.warn("[REDIS OFFLINE/FALLBACK] Redis error during GET for key '{}': {}", key, e.getMessage());
            }
        }

        // 2. Check local fallback
        CacheEntry localEntry = localFallbackCache.get(key);
        if (localEntry != null && !localEntry.isExpired()) {
            log.info("[LOCAL CACHE HIT] Key: {}", key);
            @SuppressWarnings("unchecked")
            T typed = (T) localEntry.value();
            return typed;
        }

        // 3. Compute from Database / Source of Truth
        T computed = computer.get();
        if (computed != null) {
            put(key, computed, ttl);
        }
        return computed;
    }

    public void put(String key, Object value, Duration ttl) {
        if (value == null) return;

        // Write to Redis
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(key, value, ttl);
                log.info("[REDIS CACHE WRITE] Key: {} (TTL: {}s)", key, ttl.toSeconds());
            } catch (Exception e) {
                log.warn("[REDIS OFFLINE] Failed to write key '{}' to Redis: {}", key, e.getMessage());
            }
        }

        // Write to local fallback
        long expiresAt = System.currentTimeMillis() + ttl.toMillis();
        localFallbackCache.put(key, new CacheEntry(value, expiresAt));
    }

    public void evict(String key) {
        log.info("[CACHE INVALIDATE] Evicting key: {}", key);
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(key);
            } catch (Exception e) {
                log.warn("[REDIS OFFLINE] Error deleting key '{}': {}", key, e.getMessage());
            }
        }
        localFallbackCache.remove(key);
    }

    public void evictByPrefix(String prefix) {
        log.info("[CACHE INVALIDATE] Evicting prefix: {}", prefix);
        if (redisTemplate != null) {
            try {
                Set<String> keys = redisTemplate.keys(prefix + "*");
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                }
            } catch (Exception e) {
                log.warn("[REDIS OFFLINE] Error deleting prefix '{}': {}", prefix, e.getMessage());
            }
        }
        localFallbackCache.keySet().removeIf(k -> k.startsWith(prefix));
    }

    public void invalidateUserCache(Long userId) {
        if (userId != null) {
            evictByPrefix("analytics:" + userId);
            evictByPrefix("reports:" + userId);
            evictByPrefix("devices:" + userId);
        }
    }

    public void invalidateAdminStats() {
        evict("admin:stats");
    }
}
