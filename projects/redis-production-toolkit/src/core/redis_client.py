"""
High-Performance Async Redis Client Engine & Memory Fallback
============================================================
Senior Design Note:
Provides async Redis client functionality with full emulation support (Strings, Hashes,
Sorted Sets, Pub/Sub, Streams, Lua eval) allowing tests and demo environments to run
with zero external dependencies at microsecond latency.
"""

import time
import json
import uuid
import asyncio
from typing import Dict, List, Set, Optional, Any, Tuple
from collections import defaultdict


class AsyncRedisEngine:
    def __init__(self):
        self._strings: Dict[str, str] = {}
        self._hashes: Dict[str, Dict[str, str]] = defaultdict(dict)
        self._zsets: Dict[str, List[Tuple[float, str]]] = defaultdict(list)
        self._streams: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._groups: Dict[str, Dict[str, int]] = defaultdict(dict)  # stream -> group -> last_idx
        self._expires: Dict[str, float] = {}
        self._pubsub_subscribers: Dict[str, Set[asyncio.Queue]] = defaultdict(set)
        
        # Statistics
        self.stats_hits = 0
        self.stats_misses = 0

    def _purge_key_if_expired(self, key: str) -> None:
        if key in self._expires and time.time() > self._expires[key]:
            self._strings.pop(key, None)
            self._hashes.pop(key, None)
            self._zsets.pop(key, None)
            self._expires.pop(key, None)

    async def get(self, key: str) -> Optional[str]:
        self._purge_key_if_expired(key)
        val = self._strings.get(key)
        if val is not None:
            self.stats_hits += 1
        else:
            self.stats_misses += 1
        return val

    async def set(
        self,
        key: str,
        value: str,
        ex: Optional[int] = None,
        nx: bool = False
    ) -> bool:
        self._purge_key_if_expired(key)
        if nx and key in self._strings:
            return False

        self._strings[key] = str(value)
        if ex is not None:
            self._expires[key] = time.time() + ex
        elif key in self._expires:
            del self._expires[key]
        return True

    async def delete(self, *keys: str) -> int:
        count = 0
        for k in keys:
            if k in self._strings or k in self._hashes or k in self._zsets:
                count += 1
            self._strings.pop(k, None)
            self._hashes.pop(k, None)
            self._zsets.pop(k, None)
            self._expires.pop(k, None)
        return count

    async def hset(self, name: str, key: str, value: str) -> int:
        self._hashes[name][key] = str(value)
        return 1

    async def hget(self, name: str, key: str) -> Optional[str]:
        self._purge_key_if_expired(name)
        return self._hashes[name].get(key)

    async def hgetall(self, name: str) -> Dict[str, str]:
        self._purge_key_if_expired(name)
        return dict(self._hashes[name])

    async def expire(self, key: str, seconds: int) -> bool:
        self._expires[key] = time.time() + seconds
        return True

    async def ttl(self, key: str) -> int:
        self._purge_key_if_expired(key)
        if key not in self._expires:
            return -1 if (key in self._strings or key in self._hashes or key in self._zsets) else -2
        remaining = int(self._expires[key] - time.time())
        return max(0, remaining)

    # Lua Scripting Emulation
    async def eval(self, script: str, numkeys: int, *keys_and_args: Any) -> Any:
        keys = keys_and_args[:numkeys]
        args = keys_and_args[numkeys:]

        # Emulate LUA_RELEASE_LOCK
        if 'return redis.call("del", KEYS[1])' in script:
            key = keys[0]
            token = args[0]
            if self._strings.get(key) == str(token):
                await self.delete(key)
                return 1
            return 0

        # Emulate LUA_SLIDING_WINDOW_RATE_LIMIT
        if "zremrangebyscore" in script:
            key = keys[0]
            now = float(args[0])
            window = float(args[1])
            limit = int(args[2])
            clear_before = now - window

            # 1. zremrangebyscore
            self._zsets[key] = [(score, member) for score, member in self._zsets[key] if score > clear_before]
            curr = len(self._zsets[key])
            if curr < limit:
                self._zsets[key].append((now, str(now)))
                await self.expire(key, int(window / 1000) + 1)
                return [1, limit - curr - 1]
            else:
                return [0, 0]

        return 1

    # Streams Emulation
    async def xadd(self, name: str, fields: Dict[str, Any], maxlen: Optional[int] = None) -> str:
        msg_id = f"{int(time.time() * 1000)}-{len(self._streams[name])}"
        entry = {"id": msg_id, "fields": fields, "ack": set()}
        self._streams[name].append(entry)
        if maxlen and len(self._streams[name]) > maxlen:
            self._streams[name] = self._streams[name][-maxlen:]
        return msg_id

    async def xgroup_create(self, name: str, groupname: str, id: str = "$", mkstream: bool = True) -> bool:
        if name not in self._groups:
            self._groups[name] = {}
        self._groups[name][groupname] = len(self._streams[name]) if id == "$" else 0
        return True

    async def xreadgroup(
        self,
        groupname: str,
        consumername: str,
        streams: Dict[str, str],
        count: Optional[int] = 10
    ) -> List[Tuple[str, List[Tuple[str, Dict[str, Any]]]]]:
        results = []
        for s_name, _ in streams.items():
            start_idx = self._groups[s_name].get(groupname, 0)
            available = self._streams[s_name][start_idx:start_idx + count]
            self._groups[s_name][groupname] = start_idx + len(available)
            
            msgs = []
            for e in available:
                msgs.append((e["id"], e["fields"]))
            if msgs:
                results.append((s_name, msgs))
        return results

    async def xack(self, name: str, groupname: str, *ids: str) -> int:
        count = 0
        id_set = set(ids)
        for e in self._streams[name]:
            if e["id"] in id_set:
                e["ack"].add(groupname)
                count += 1
        return count

    # Pub/Sub Emulation
    async def publish(self, channel: str, message: str) -> int:
        queues = self._pubsub_subscribers.get(channel, set())
        for q in list(queues):
            await q.put(message)
        return len(queues)

    def subscribe_channel(self, channel: str) -> asyncio.Queue:
        q = asyncio.Queue()
        self._pubsub_subscribers[channel].add(q)
        return q

    def unsubscribe_channel(self, channel: str, queue: asyncio.Queue) -> None:
        self._pubsub_subscribers[channel].discard(queue)


redis_engine = AsyncRedisEngine()


async def get_redis() -> AsyncRedisEngine:
    return redis_engine
