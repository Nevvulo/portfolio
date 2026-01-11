import type { Id } from "../convex/_generated/dataModel";

/**
 * User tier levels
 * - free: Free users with limited access
 * - tier1: Super Legend (paid tier 1)
 * - tier2: Super Legend II (paid tier 2)
 */
export type Tier = "free" | "tier1" | "tier2";

/**
 * User presence status
 */
export type PresenceStatus = "online" | "offline" | "away";

/**
 * Channel types
 */
export type ChannelType = "chat" | "announcements" | "content";

/**
 * Content post types
 */
export type ContentPostType =
  | "music"
  | "video"
  | "writing"
  | "game_build"
  | "news"
  | "tools"
  | "event"
  | "advice"
  | "giveaway"
  | "poll"
  | "emoji";

/**
 * Notification types
 */
export type NotificationType =
  | "mention"
  | "reply"
  | "new_content"
  | "reward"
  | "giveaway_win"
  | "channel_message"
  | "comment_reply"
  | "collaborator_added"
  | "comment_reaction"
  | "feed_reply"
  | "feed_reaction";

/**
 * Reward types
 */
export type RewardType = "monthly_drop" | "special";

/**
 * Reveal animation types
 */
export type RevealType = "scratch" | "mystery_box";

/**
 * Item rarity levels (Fortnite-inspired)
 */
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/**
 * Mystery box animation states
 */
export type MysteryBoxState =
  | "idle" // Unopened, waiting for click
  | "shaking" // Pre-open shake/glow phase
  | "opening" // Box exploding open
  | "revealing" // Items being revealed one by one
  | "complete"; // All items shown, ready to claim

/**
 * Lounge user (from Convex)
 */
export interface LoungeUser {
  _id: Id<"users">;
  clerkId: string;
  discordId?: string;
  displayName: string;
  avatarUrl?: string;
  tier: Tier;
  tierValidUntil?: number;
  isCreator: boolean;
  status: PresenceStatus;
  lastSeenAt: number;
  notificationPreferences: {
    emailDigest: "daily" | "weekly" | "none";
    inAppNotifications: boolean;
  };
  // Profile fields for UserPopout
  bannerUrl?: string;
  bannerFocalY?: number;
  bio?: string;
  createdAt: number;
}

/**
 * Channel with access info
 */
export interface ChannelWithAccess {
  _id: Id<"channels">;
  name: string;
  slug: string;
  description?: string;
  type: ChannelType;
  requiredTier: Tier;
  order: number;
  icon?: string;
  isArchived: boolean;
  discordChannelId?: string;
  hasAccess: boolean;
  isLocked: boolean;
  createdAt: number;
}

/**
 * Message author info
 */
export interface MessageAuthor {
  _id?: Id<"users">;
  displayName: string;
  avatarUrl?: string;
  tier?: Tier;
  isCreator?: boolean;
  isDiscord?: boolean;
}

/**
 * Discord author (for wormhole messages)
 */
export interface DiscordAuthor {
  id: string;
  username: string;
  discriminator?: string;
  avatarUrl?: string;
}

/**
 * Embed types
 */
export type EmbedType = "link" | "image" | "video" | "audio" | "youtube";

/**
 * Message embed
 */
export interface MessageEmbed {
  type: EmbedType;
  url?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  // File attachment fields
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  // Video embed specific
  embedUrl?: string;
  // Link preview metadata
  siteName?: string;
}

/**
 * Reaction group
 */
export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: Id<"users">[];
}

/**
 * Reply preview
 */
export interface ReplyPreview {
  _id: Id<"messages">;
  content: string;
  author: MessageAuthor | null;
}

/**
 * Full message with all details
 */
export interface Message {
  _id: Id<"messages">;
  channelId: Id<"channels">;
  authorId: Id<"users">;
  content: string;
  embeds?: MessageEmbed[];
  replyToId?: Id<"messages">;
  threadId?: Id<"threads">;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  discordMessageId?: string;
  discordAuthor?: DiscordAuthor;
  createdAt: number;
  editedAt?: number;
  // Populated fields
  author: MessageAuthor | null;
  replyTo: ReplyPreview | null;
  reactions: ReactionGroup[];
}

/**
 * Content post media
 */
export interface ContentMedia {
  type: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  fileSize?: number;
  platforms?: string[];
  soundcloudUrl?: string;
}

/**
 * Event data
 */
export interface EventData {
  startTime: number;
  endTime?: number;
  timezone: string;
  location?: string;
}

/**
 * Giveaway data
 */
export interface GiveawayData {
  endsAt: number;
  maxEntries?: number;
  prize: string;
  winnerId?: Id<"users">;
}

/**
 * Poll option
 */
export interface PollOption {
  id: string;
  text: string;
}

/**
 * Poll data
 */
export interface PollData {
  options: PollOption[];
  endsAt?: number;
  allowMultiple: boolean;
}

/**
 * Emoji data
 */
export interface EmojiData {
  emoji: string;
  message?: string;
}

/**
 * Content post
 */
export interface ContentPost {
  _id: Id<"contentPosts">;
  authorId: Id<"users">;
  channelId: Id<"channels">;
  type: ContentPostType;
  title: string;
  content: string;
  media?: ContentMedia;
  eventData?: EventData;
  giveawayData?: GiveawayData;
  pollData?: PollData;
  emojiData?: EmojiData;
  requiredTier: Tier;
  isPinned: boolean;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Reward item with rarity and claim tracking
 */
export interface RewardItem {
  id: string; // Unique item ID for tracking
  type: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  assetUrl?: string; // Vercel Blob URL for downloadables
  code?: string; // Discount codes, unlock codes, etc.
  isClaimed: boolean; // Track if item has been claimed/downloaded
  claimedAt?: number; // Timestamp when claimed
  expiresAt?: number; // Optional expiration date
}

/**
 * Reward template item (for admin creation)
 */
export interface RewardTemplateItem {
  type: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  assetUrl?: string;
  code?: string;
  expiresAfterDays?: number; // Relative expiration
}

/**
 * Reward / Loot drop (Mystery Box)
 */
export interface Reward {
  _id: Id<"rewards">;
  userId: Id<"users">;
  type: RewardType;
  month: string;
  items: RewardItem[];
  isRevealed: boolean;
  revealedAt?: number;
  revealType?: RevealType;
  deliveredAt: number;
  emailSentAt?: number;
}

/**
 * Reward template for admin creation
 */
export interface RewardTemplate {
  _id: Id<"rewardTemplates">;
  name: string;
  description?: string;
  type: RewardType;
  revealType: RevealType;
  items: RewardTemplateItem[];
  targetTiers: ("free" | "tier1" | "tier2" | "all")[];
  isActive: boolean;
  createdAt: number;
}

/**
 * Scheduled drop status
 */
export type ScheduledDropStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Scheduled drop
 */
export interface ScheduledDrop {
  _id: Id<"scheduledDrops">;
  templateId?: Id<"rewardTemplates">;
  month: string;
  targetTier: "free" | "tier1" | "tier2" | "all";
  status: ScheduledDropStatus;
  processedCount: number;
  totalCount: number;
  scheduledAt: number;
  processedAt?: number;
  errorMessage?: string;
}

/**
 * Inventory item (flattened from rewards for display)
 */
export interface InventoryItem extends RewardItem {
  rewardId: Id<"rewards">;
  rewardMonth: string;
  rewardType: RewardType;
}

/**
 * Notification
 */
export interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  type: NotificationType;
  referenceType?: "message" | "contentPost" | "reward" | "blogComment" | "blogPost" | "feedPost";
  referenceId?: string;
  channelId?: Id<"channels">;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: number;
}

/**
 * Typing user
 */
export interface TypingUser {
  _id: Id<"users">;
  displayName: string;
  avatarUrl?: string;
}

/**
 * Online member (simplified user for presence)
 */
export interface OnlineMember {
  _id: Id<"users">;
  displayName: string;
  avatarUrl?: string;
  tier: Tier;
  isCreator: boolean;
  status: PresenceStatus;
}

/**
 * Messages list response
 */
export interface MessagesListResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor: Id<"messages"> | null;
}

/**
 * Unread counts per channel
 */
export type UnreadCounts = Record<string, number>;
