import { useEffect, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import { Message } from "./Message";
import { SystemMessage, type SystemMessageType } from "./SystemMessage";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { EmbeddedContentPost } from "./EmbeddedContentPost";
import { getCachedMessages, setCachedMessages, hasChannelBeenFetched } from "../../../lib/lounge/messageCache";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Tier, MessageEmbed, ContentPostType } from "../../../types/lounge";
import { Icon } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage } from "@fortawesome/free-solid-svg-icons";

// Pending message for optimistic updates
interface PendingMessage {
  tempId: string;
  content: string;
  embeds?: MessageEmbed[];
  createdAt: number;
  status: "sending" | "error";
}

// Message grouping threshold (5 minutes in milliseconds)
const MESSAGE_GROUP_THRESHOLD = 5 * 60 * 1000;

// Helper to determine if messages should be grouped
function shouldGroupMessages(
  currentMsg: MessageData,
  prevMsg: MessageData | null
): boolean {
  if (!prevMsg) return false;

  // Don't group system messages
  const systemTypes = ["system", "emoji_blast", "join", "leave", "boost", "giveaway", "poll", "content"];
  if (systemTypes.includes(currentMsg.messageType || "") || systemTypes.includes(prevMsg.messageType || "")) {
    return false;
  }

  // Must be same author
  const currentAuthorId = currentMsg.author?.clerkId || currentMsg.authorId;
  const prevAuthorId = prevMsg.author?.clerkId || prevMsg.authorId;
  if (currentAuthorId !== prevAuthorId) return false;

  // Must be within time threshold
  const timeDiff = currentMsg.createdAt - prevMsg.createdAt;
  if (timeDiff > MESSAGE_GROUP_THRESHOLD) return false;

  return true;
}

interface ChatViewProps {
  channelId: Id<"channels">;
  channelName: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  currentUserTier: Tier;
  isCreator: boolean;
}

interface MessageAuthor {
  _id?: Id<"users">;
  clerkId?: string;
  displayName: string;
  avatarUrl?: string;
  tier?: Tier;
  isCreator?: boolean;
  isDiscord?: boolean;
}

interface ContentPostData {
  _id: Id<"contentPosts">;
  type: ContentPostType;
  title: string;
  content: string;
  media?: {
    type: string;
    url: string;
    thumbnail?: string;
    duration?: number;
    soundcloudUrl?: string;
  };
  eventData?: {
    startTime: number;
    endTime?: number;
    timezone: string;
    location?: string;
  };
  giveawayData?: {
    endsAt: number;
    prize: string;
    maxEntries?: number;
  };
  pollData?: {
    options: { id: string; text: string }[];
    endsAt?: number;
    allowMultiple: boolean;
  };
  emojiData?: {
    emoji: string;
    message?: string;
  };
  requiredTier: Tier;
  isPinned: boolean;
  createdAt: number;
}

interface MessageData {
  _id: Id<"messages">;
  content: string;
  embeds?: MessageEmbed[];
  authorId: Id<"users">;
  author: MessageAuthor | null;
  createdAt: number;
  isEdited: boolean;
  isPinned: boolean;
  discordAuthor?: { username: string; avatarUrl?: string };
  messageType?: "default" | "system" | "emoji_blast" | "join" | "leave" | "boost" | "giveaway" | "poll" | "content";
  contentPost?: ContentPostData | null;
}

export function ChatView({ channelId, channelName, currentUserId, currentUserName, currentUserAvatar, currentUserTier, isCreator }: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  // Load cached messages synchronously on init
  const [cachedMessages, setCachedMessagesState] = useState<MessageData[]>(() => {
    const cached = getCachedMessages(channelId);
    if (cached.length > 0) {
      return cached.map((c) => ({
        _id: c._id as Id<"messages">,
        content: c.content,
        authorId: c.authorId as Id<"users">,
        author: c.author ? {
          _id: c.author._id as Id<"users"> | undefined,
          clerkId: c.author.clerkId,
          displayName: c.author.displayName,
          avatarUrl: c.author.avatarUrl,
          tier: c.author.tier as Tier | undefined,
          isCreator: c.author.isCreator,
          isDiscord: c.author.isDiscord,
        } : null,
        createdAt: c.createdAt,
        isEdited: c.isEdited,
        isPinned: c.isPinned,
        discordAuthor: c.discordAuthor,
        messageType: c.messageType,
      }));
    }
    return [];
  });

  // Load cached messages on channel change
  useEffect(() => {
    const cached = getCachedMessages(channelId);
    if (cached.length > 0) {
      const mapped: MessageData[] = cached.map((c) => ({
        _id: c._id as Id<"messages">,
        content: c.content,
        authorId: c.authorId as Id<"users">,
        author: c.author ? {
          _id: c.author._id as Id<"users"> | undefined,
          clerkId: c.author.clerkId,
          displayName: c.author.displayName,
          avatarUrl: c.author.avatarUrl,
          tier: c.author.tier as Tier | undefined,
          isCreator: c.author.isCreator,
          isDiscord: c.author.isDiscord,
        } : null,
        createdAt: c.createdAt,
        isEdited: c.isEdited,
        isPinned: c.isPinned,
        discordAuthor: c.discordAuthor,
        messageType: c.messageType,
        // CRITICAL: Include embeds for image dimensions (CLS prevention)
        embeds: c.embeds as MessageEmbed[] | undefined,
        replyTo: c.replyTo as MessageData["replyTo"],
        reactions: c.reactions as MessageData["reactions"],
        contentPost: c.contentPost as MessageData["contentPost"],
      }));
      setCachedMessagesState(mapped);
    } else {
      setCachedMessagesState([]);
    }
  }, [channelId]);

  // Messages query
  const messagesResult = useQuery(api.messages.list, { channelId }) as {
    messages: MessageData[];
    hasMore: boolean;
    nextCursor: string | null;
  } | undefined;

  const serverMessages = messagesResult?.messages;

  // Update cache when server messages arrive (even if 0 messages)
  useEffect(() => {
    if (serverMessages !== undefined) {
      // Map to cache format - INCLUDE EMBEDS for image dimensions!
      const toCache = serverMessages.map((m) => ({
        _id: m._id as string,
        content: m.content,
        authorId: m.authorId as string,
        author: m.author,
        createdAt: m.createdAt,
        isEdited: m.isEdited,
        isPinned: m.isPinned,
        discordAuthor: m.discordAuthor,
        embeds: m.embeds, // Critical for CLS prevention!
        messageType: m.messageType,
        contentPost: m.contentPost,
        replyTo: m.replyTo,
        reactions: m.reactions,
      }));
      setCachedMessages(channelId, toCache);
    }
  }, [channelId, serverMessages]);

  // Use server messages if available, otherwise show cached
  const messages = serverMessages ?? cachedMessages;

  // Mutations
  const sendMessage = useMutation(api.messages.send);
  const editMessage = useMutation(api.messages.edit);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const togglePin = useMutation(api.messages.togglePin);
  const markRead = useMutation(api.messages.markChannelRead);

  // Mark channel as read when viewing
  useEffect(() => {
    markRead({ channelId });
  }, [channelId, markRead]);

  // Check if channel has ever been fetched (even if 0 messages)
  const channelHasBeenFetched = hasChannelBeenFetched(channelId);

  // Derive loading state - only show loading if never fetched AND no server data
  const isLoading = serverMessages === undefined && !channelHasBeenFetched;

  // Clear pending messages when they appear in server response
  useEffect(() => {
    if (!messages || pendingMessages.length === 0) return;

    // Remove pending messages that have been confirmed by server
    // (matched by content and approximate timestamp)
    setPendingMessages((prev) =>
      prev.filter((pending) => {
        const isConfirmed = messages.some(
          (msg) =>
            msg.content === pending.content &&
            Math.abs(msg.createdAt - pending.createdAt) < 5000
        );
        return !isConfirmed;
      })
    );
  }, [messages, pendingMessages.length]);

  // Track channel and scroll state
  const prevChannelId = useRef<string | null>(null);
  const hasScrolledForChannel = useRef(false);
  const prevMessageCount = useRef(0);

  // Reset scroll state when channel changes
  useEffect(() => {
    if (prevChannelId.current !== channelId) {
      hasScrolledForChannel.current = false;
      prevMessageCount.current = 0;
      prevChannelId.current = channelId;
    }
  }, [channelId]);

  // Scroll to bottom when messages load (initial or channel switch)
  useEffect(() => {
    if (messages && messages.length > 0 && !hasScrolledForChannel.current) {
      // Use double RAF to ensure DOM is fully ready after React render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
          hasScrolledForChannel.current = true;
          prevMessageCount.current = messages.length + pendingMessages.length;
        });
      });
    }
  }, [messages, pendingMessages.length]);

  // Scroll to bottom for NEW messages only (after initial scroll)
  useEffect(() => {
    if (!hasScrolledForChannel.current) return;

    const totalMessages = (messages?.length ?? 0) + pendingMessages.length;
    if (totalMessages > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCount.current = totalMessages;
  }, [messages?.length, pendingMessages.length]);

  // Optimistic send handler
  const handleSend = useCallback(async (content: string, embeds?: MessageEmbed[]) => {
    const tempId = `pending-${Date.now()}-${Math.random()}`;
    const createdAt = Date.now();

    // Add pending message immediately
    setPendingMessages((prev) => [
      ...prev,
      { tempId, content, embeds, createdAt, status: "sending" },
    ]);

    try {
      await sendMessage({ channelId, content, embeds });
      // Message will be removed from pending when it appears in server response
    } catch (error) {
      console.error("Failed to send message:", error);
      // Mark as error
      setPendingMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: "error" } : msg
        )
      );
    }
  }, [channelId, sendMessage]);

  // Retry failed message
  const handleRetry = useCallback((tempId: string) => {
    const pending = pendingMessages.find((p) => p.tempId === tempId);
    if (pending) {
      setPendingMessages((prev) => prev.filter((p) => p.tempId !== tempId));
      handleSend(pending.content, pending.embeds);
    }
  }, [pendingMessages, handleSend]);

  // Dismiss failed message
  const handleDismiss = useCallback((tempId: string) => {
    setPendingMessages((prev) => prev.filter((p) => p.tempId !== tempId));
  }, []);

  const handleEdit = async (id: Id<"messages">, content: string) => {
    try {
      await editMessage({ messageId: id, content });
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleDelete = async (id: Id<"messages">) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteMessage({ messageId: id });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handlePin = async (id: Id<"messages">) => {
    try {
      await togglePin({ messageId: id });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  // Messages are already in chronological order from the query
  const sortedMessages = messages ?? [];

  return (
    <ChatContainer>
      <MessagesContainer ref={containerRef}>
        {sortedMessages.length === 0 && !isLoading && (
          <EmptyState>
            <FontAwesomeIcon style={{ marginBottom: 24 }} icon={faMessage} />
            <EmptyTitle>nothing here</EmptyTitle>
            <EmptyText>Be the first to say something in #{channelName}!</EmptyText>
          </EmptyState>
        )}

        {isLoading && (
          <LoadingState>
            <LoadingSpinner />
            <span>Loading messages...</span>
          </LoadingState>
        )}

        {sortedMessages.map((message: MessageData, index: number) => {
          const isFromDiscord = message.author?.isDiscord === true;
          // For linked Discord users, we have author._id; for unlinked, we don't
          const linkedUserId = isFromDiscord ? message.author?._id : undefined;
          const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
          const isGrouped = shouldGroupMessages(message, prevMessage);

          // Render system messages (emoji_blast, join, leave, boost) as single-line
          const systemTypes: SystemMessageType[] = ["system", "emoji_blast", "join", "leave", "boost"];
          if (message.messageType && systemTypes.includes(message.messageType as SystemMessageType)) {
            return (
              <SystemMessage
                key={message._id}
                type={message.messageType as SystemMessageType}
                authorName={message.author?.displayName ?? "Unknown"}
                content={message.content}
                createdAt={message.createdAt}
              />
            );
          }

          // Render content post messages (giveaway, poll, content) with embedded post
          const contentPostTypes = ["giveaway", "poll", "content"];
          if (message.messageType && contentPostTypes.includes(message.messageType) && message.contentPost) {
            return (
              <EmbeddedContentPost
                key={message._id}
                messageId={message._id}
                post={message.contentPost}
                author={message.author}
                createdAt={message.createdAt}
                isPinned={message.isPinned}
                isOwnMessage={message.author?.clerkId === currentUserId}
                isCreator={isCreator}
                onDelete={handleDelete}
                onPin={handlePin}
              />
            );
          }

          return (
            <Message
              key={message._id}
              id={message._id}
              content={message.content}
              embeds={message.embeds}
              authorId={linkedUserId ?? (!isFromDiscord ? message.authorId : undefined)}
              authorName={message.author?.displayName ?? "Unknown"}
              authorAvatar={message.author?.avatarUrl}
              authorTier={message.author?.tier ?? "tier1"}
              createdAt={message.createdAt}
              isEdited={message.isEdited}
              isPinned={message.isPinned}
              isFromDiscord={isFromDiscord}
              discordAuthor={isFromDiscord && !linkedUserId && message.discordAuthor ? {
                name: message.discordAuthor.username,
                avatar: message.discordAuthor.avatarUrl,
              } : undefined}
              isOwnMessage={message.author?.clerkId === currentUserId}
              isCreator={isCreator}
              isGrouped={isGrouped}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
            />
          );
        })}

        {/* Pending messages (optimistic) */}
        {pendingMessages.map((pending) => (
          <PendingWrapper key={pending.tempId} $isError={pending.status === "error"}>
            <Message
              id={pending.tempId as unknown as Id<"messages">}
              content={pending.content}
              embeds={pending.embeds}
              authorName={currentUserName}
              authorAvatar={currentUserAvatar}
              authorTier={currentUserTier}
              createdAt={pending.createdAt}
              isOwnMessage={true}
              isCreator={isCreator}
            />
            {pending.status === "error" && (
              <PendingErrorActions>
                <PendingRetryButton onClick={() => handleRetry(pending.tempId)}>
                  Retry
                </PendingRetryButton>
                <PendingDismissButton onClick={() => handleDismiss(pending.tempId)}>
                  ×
                </PendingDismissButton>
              </PendingErrorActions>
            )}
          </PendingWrapper>
        ))}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputSection>
        <TypingIndicator channelId={channelId} />
        <MessageInput channelId={channelId} channelName={channelName} onSend={handleSend} />
      </InputSection>
    </ChatContainer>
  );
}

// Styled Components
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
`;

const InputSection = styled.div`
  border-top: 1px solid ${LOUNGE_COLORS.glassBorder};
  background: ${LOUNGE_COLORS.glassBackground};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 2rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-family: "Sixtyfour", monospace;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${LOUNGE_COLORS.glassBorder};
  border-top-color: ${LOUNGE_COLORS.tier1};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Pending message styles (optimistic updates)
const PendingWrapper = styled.div<{ $isError: boolean }>`
  position: relative;
  opacity: ${(props) => (props.$isError ? 1 : 0.6)};
  background: ${(props) =>
    props.$isError ? "rgba(237, 66, 69, 0.1)" : "transparent"};
`;

const PendingErrorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem 0.25rem 3.5rem;
  font-size: 0.75rem;
`;

const PendingRetryButton = styled.button`
  background: rgba(237, 66, 69, 0.2);
  border: none;
  color: #ed4245;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: rgba(237, 66, 69, 0.3);
  }
`;

const PendingDismissButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0 4px;

  &:hover {
    color: #fff;
  }
`;
