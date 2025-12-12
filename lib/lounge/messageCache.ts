const CACHE_KEY = "lounge_messages_cache";
const MAX_MESSAGES_PER_CHANNEL = 50;
const CACHE_VERSION = 3; // Bumped for embeds support (CLS fix)

export interface CachedEmbed {
  type: "link" | "image" | "video" | "audio" | "youtube";
  url?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  embedUrl?: string;
  siteName?: string;
}

export interface CachedMessage {
  _id: string;
  content: string;
  authorId: string;
  author: {
    _id?: string;
    clerkId?: string;
    displayName: string;
    avatarUrl?: string;
    tier?: string;
    isCreator?: boolean;
    isDiscord?: boolean;
  } | null;
  createdAt: number;
  isEdited: boolean;
  isPinned: boolean;
  discordAuthor?: { username: string; avatarUrl?: string };
  messageType?: "default" | "system" | "emoji_blast" | "join" | "leave" | "boost" | "giveaway" | "poll" | "content";
  embeds?: CachedEmbed[];
  replyTo?: unknown;
  reactions?: unknown;
  contentPost?: unknown;
}

interface ChannelCache {
  messages: CachedMessage[];
  lastUpdated: number;
  hasFetched: boolean; // true even if 0 messages
}

interface MessageCacheData {
  version: number;
  channels: Record<string, ChannelCache>;
}

function getCache(): MessageCacheData {
  if (typeof window === "undefined") {
    return { version: CACHE_VERSION, channels: {} };
  }

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { version: CACHE_VERSION, channels: {} };

    const data = JSON.parse(raw) as MessageCacheData;

    // Version mismatch - clear cache
    if (data.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return { version: CACHE_VERSION, channels: {} };
    }

    return data;
  } catch {
    return { version: CACHE_VERSION, channels: {} };
  }
}

function saveCache(data: MessageCacheData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage full - clear old channels
    console.warn("Cache storage full, clearing old data");
    const channels = Object.entries(data.channels)
      .sort(([, a], [, b]) => b.lastUpdated - a.lastUpdated)
      .slice(0, 5); // Keep only 5 most recent channels

    const trimmed: MessageCacheData = {
      version: CACHE_VERSION,
      channels: Object.fromEntries(channels),
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }
}

export function getCachedMessages(channelId: string): CachedMessage[] {
  const cache = getCache();
  return cache.channels[channelId]?.messages ?? [];
}

export function hasChannelBeenFetched(channelId: string): boolean {
  const cache = getCache();
  return cache.channels[channelId]?.hasFetched ?? false;
}

export function setCachedMessages(channelId: string, messages: CachedMessage[]): void {
  const cache = getCache();

  // Keep only the most recent 50 messages
  const trimmed = messages
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-MAX_MESSAGES_PER_CHANNEL);

  cache.channels[channelId] = {
    messages: trimmed,
    lastUpdated: Date.now(),
    hasFetched: true,
  };

  saveCache(cache);
}

export function addMessageToCache(channelId: string, message: CachedMessage): void {
  const cache = getCache();
  const channelCache = cache.channels[channelId] ?? { messages: [], lastUpdated: 0, hasFetched: false };

  // Check if message already exists (by ID)
  const existingIndex = channelCache.messages.findIndex((m) => m._id === message._id);

  if (existingIndex >= 0) {
    // Update existing message
    channelCache.messages[existingIndex] = message;
  } else {
    // Add new message
    channelCache.messages.push(message);

    // Trim to max size (keep most recent)
    if (channelCache.messages.length > MAX_MESSAGES_PER_CHANNEL) {
      channelCache.messages = channelCache.messages
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-MAX_MESSAGES_PER_CHANNEL);
    }
  }

  channelCache.lastUpdated = Date.now();
  cache.channels[channelId] = channelCache;
  saveCache(cache);
}

export function updateMessageInCache(
  channelId: string,
  messageId: string,
  updates: Partial<CachedMessage>
): void {
  const cache = getCache();
  const channelCache = cache.channels[channelId];

  if (!channelCache) return;

  const messageIndex = channelCache.messages.findIndex((m) => m._id === messageId);
  if (messageIndex >= 0) {
    const existing = channelCache.messages[messageIndex]!;
    channelCache.messages[messageIndex] = {
      _id: updates._id ?? existing._id,
      content: updates.content ?? existing.content,
      authorId: updates.authorId ?? existing.authorId,
      author: updates.author !== undefined ? updates.author : existing.author,
      createdAt: updates.createdAt ?? existing.createdAt,
      isEdited: updates.isEdited ?? existing.isEdited,
      isPinned: updates.isPinned ?? existing.isPinned,
      discordAuthor: updates.discordAuthor !== undefined ? updates.discordAuthor : existing.discordAuthor,
      messageType: updates.messageType !== undefined ? updates.messageType : existing.messageType,
      embeds: updates.embeds !== undefined ? updates.embeds : existing.embeds,
      replyTo: updates.replyTo !== undefined ? updates.replyTo : existing.replyTo,
      reactions: updates.reactions !== undefined ? updates.reactions : existing.reactions,
      contentPost: updates.contentPost !== undefined ? updates.contentPost : existing.contentPost,
    };
    channelCache.lastUpdated = Date.now();
    saveCache(cache);
  }
}

export function removeMessageFromCache(channelId: string, messageId: string): void {
  const cache = getCache();
  const channelCache = cache.channels[channelId];

  if (!channelCache) return;

  channelCache.messages = channelCache.messages.filter((m) => m._id !== messageId);
  channelCache.lastUpdated = Date.now();
  saveCache(cache);
}

export function clearChannelCache(channelId: string): void {
  const cache = getCache();
  delete cache.channels[channelId];
  saveCache(cache);
}

export function clearAllCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}
