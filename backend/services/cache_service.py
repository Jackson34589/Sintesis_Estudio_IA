import hashlib
from collections import OrderedDict

MAX_CACHE_ENTRIES = 40  # evict oldest when limit reached


class CacheService:
    def __init__(self):
        self.cache: OrderedDict = OrderedDict()

    def get_cache_key(self, text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()

    def get(self, text: str):
        key = self.get_cache_key(text)
        if key in self.cache:
            self.cache.move_to_end(key)  # mark as recently used
            return self.cache[key]
        return None

    def set(self, text: str, synthesis: str):
        key = self.get_cache_key(text)
        self.cache[key] = synthesis
        self.cache.move_to_end(key)
        if len(self.cache) > MAX_CACHE_ENTRIES:
            self.cache.popitem(last=False)  # evict oldest

    def stats(self) -> dict:
        return {"total_cached": len(self.cache), "max_entries": MAX_CACHE_ENTRIES}


cache_service = CacheService()
