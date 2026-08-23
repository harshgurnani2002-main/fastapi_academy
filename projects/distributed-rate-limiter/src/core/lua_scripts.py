"""
Atomic Redis Lua Rate Limiting Scripts
======================================
Senior Design Note:
1. LUA_SLIDING_WINDOW: Uses Sorted Sets (ZSET) for exact millisecond timestamp logging.
2. LUA_TOKEN_BUCKET: Uses Redis Hashes with elapsed time math for smooth replenishment & bursts.
"""

LUA_SLIDING_WINDOW = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local clearBefore = now - window

redis.call('zremrangebyscore', key, 0, clearBefore)
local currentRequests = redis.call('zcard', key)
if currentRequests < limit then
    redis.call('zadd', key, now, now)
    redis.call('expire', key, math.ceil(window / 1000) + 1)
    return {1, limit - currentRequests - 1, math.ceil(window / 1000)}
else
    local oldest = redis.call('zrange', key, 0, 0, 'WITHSCORES')
    local retryAfter = 1
    if #oldest > 0 then
        retryAfter = math.ceil((tonumber(oldest[2]) + window - now) / 1000)
    end
    return {0, 0, math.max(1, retryAfter)}
end
"""

LUA_TOKEN_BUCKET = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local data = redis.call('hmget', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if not tokens then
    tokens = capacity
    last_refill = now
else
    local elapsed = math.max(0, (now - last_refill) / 1000)
    tokens = math.min(capacity, tokens + (elapsed * refill_rate))
    last_refill = now
end

if tokens >= cost then
    tokens = tokens - cost
    redis.call('hmset', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('expire', key, math.ceil(capacity / refill_rate) * 2 + 1)
    return {1, math.floor(tokens), 0}
else
    local needed = cost - tokens
    local retryAfter = math.ceil(needed / refill_rate)
    redis.call('hmset', key, 'tokens', tokens, 'last_refill', last_refill)
    return {0, 0, math.max(1, retryAfter)}
end
"""
