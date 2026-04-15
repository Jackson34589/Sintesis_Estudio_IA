import hashlib


class CacheService:
    def __init__(self):
        self.cache: dict = {}

    def get_cache_key(self, text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()

    def get(self, text: str):
        key = self.get_cache_key(text)
        return self.cache.get(key)

    def set(self, text: str, synthesis: str):
        key = self.get_cache_key(text)
        self.cache[key] = synthesis

    def stats(self) -> dict:
        return {"total_cached": len(self.cache)}


cache_service = CacheService()
