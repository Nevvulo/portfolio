const CACHE_KEY = "lounge_channels_cache";

interface CachedChannel {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  type: string;
  icon?: string;
  requiredTier: string;
  hasAccess: boolean;
  isLocked: boolean;
  cachedAt: number;
}

interface ChannelCacheData {
  channels: Record<string, CachedChannel>;
}

function getCache(): ChannelCacheData {
  if (typeof window === "undefined") {
    return { channels: {} };
  }

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { channels: {} };
    return JSON.parse(raw) as ChannelCacheData;
  } catch {
    return { channels: {} };
  }
}

function saveCache(data: ChannelCacheData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage full - just ignore
  }
}

export function getCachedChannel(slug: string): CachedChannel | null {
  const cache = getCache();
  const channel = cache.channels[slug];
  // Return if cached within last hour
  if (channel && Date.now() - channel.cachedAt < 3600000) {
    return channel;
  }
  return null;
}

export function setCachedChannel(channel: CachedChannel): void {
  const cache = getCache();
  cache.channels[channel.slug] = {
    ...channel,
    cachedAt: Date.now(),
  };
  saveCache(cache);
}

export function clearChannelCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}
