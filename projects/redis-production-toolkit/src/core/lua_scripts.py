"""
Atomic Redis Lua Scripts
========================
Senior Design Note:
1. LUA_RELEASE_LOCK: Releases distributed lock only if caller provides the exact owner UUID token.
2. LUA_SLIDING_WINDOW_RATE_LIMIT: Sliding window counter executed atomically in a single Redis roundtrip.
"""

LUA_RELEASE_LOCK = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""

LUA_SLIDING_WINDOW_RATE_LIMIT = """
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
    return {1, limit - currentRequests - 1}
else
    return {0, 0}
end
"""
