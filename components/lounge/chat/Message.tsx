import { useState, useCallback } from "react";
import styled from "styled-components";
import { Edit2, Trash2, Pin, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Remove "about" prefix from relative time (e.g., "about 2 hours ago" -> "2 hours ago")
const formatRelativeTime = (date: number | Date) =>
  formatDistanceToNow(date, { addSuffix: true }).replace(/^about /, "");
import { LOUNGE_COLORS, TIER_INFO } from "../../../constants/lounge";
import { MessageMarkdown } from "./MessageMarkdown";
import { MessageEmbeds } from "./embeds";
import { useUserPopout } from "../../../hooks/lounge/useUserPopout";
import type { Tier, MessageEmbed } from "../../../types/lounge";
import type { Id } from "../../../convex/_generated/dataModel";

interface MessageProps {
  id: Id<"messages">;
  content: string;
  embeds?: MessageEmbed[];
  authorId?: Id<"users">;
  authorName: string;
  authorAvatar?: string;
  authorTier: Tier;
  createdAt: number;
  isEdited?: boolean;
  isPinned?: boolean;
  isFromDiscord?: boolean;
  discordAuthor?: { name: string; avatar?: string };
  isOwnMessage: boolean;
  isCreator: boolean;
  isGrouped?: boolean;
  showTimestamp?: boolean;
  onEdit?: (id: Id<"messages">, content: string) => void;
  onDelete?: (id: Id<"messages">) => void;
  onPin?: (id: Id<"messages">) => void;
  onReply?: (id: Id<"messages">) => void;
}

export function Message({
  id,
  content,
  embeds,
  authorId,
  authorName,
  authorAvatar,
  authorTier,
  createdAt,
  isEdited,
  isPinned,
  isFromDiscord,
  discordAuthor,
  isOwnMessage,
  isCreator,
  isGrouped = false,
  showTimestamp: _showTimestamp = true,
  onEdit,
  onDelete,
  onPin,
  onReply,
}: MessageProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const { open: openPopout } = useUserPopout();

  // For linked Discord users, use their Convex profile; for unlinked, use Discord data
  const hasLinkedUser = isFromDiscord && authorId;
  const displayName = isFromDiscord && discordAuthor && !hasLinkedUser ? discordAuthor.name : authorName;
  const displayAvatar = isFromDiscord && discordAuthor && !hasLinkedUser ? discordAuthor.avatar : authorAvatar;

  // Handle clicking on the author name to open their profile
  // Allow popout for regular users AND linked Discord users (who have an authorId)
  const handleAuthorClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (authorId) {
        e.preventDefault();
        e.stopPropagation();
        openPopout(authorId, e.currentTarget);
      }
    },
    [authorId, openPopout]
  );

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit?.(id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(content);
    }
  };

  // Handle clicking on the avatar to open profile
  // Allow popout for regular users AND linked Discord users (who have an authorId)
  const handleAvatarClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (authorId) {
        e.preventDefault();
        e.stopPropagation();
        openPopout(authorId, e.currentTarget);
      }
    },
    [authorId, openPopout]
  );

  return (
    <MessageContainer
      $isPinned={isPinned}
      $isGrouped={isGrouped}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {isGrouped ? (
        <GroupedTimestampWrapper className="grouped-timestamp">
          <GroupedTimestamp>{new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</GroupedTimestamp>
        </GroupedTimestampWrapper>
      ) : (
        <AvatarWrapper>
          <AvatarButton
            onClick={handleAvatarClick}
            $clickable={!!authorId}
            disabled={!authorId}
          >
            <Avatar src={displayAvatar} alt={displayName} loading="lazy" decoding="async" />
          </AvatarButton>
          {isFromDiscord && !hasLinkedUser && <DiscordBadge>D</DiscordBadge>}
        </AvatarWrapper>
      )}

      <MessageContent>
        {!isGrouped && (
          <MessageHeader>
            <AuthorName
              as={authorId ? "button" : "span"}
              $tier={authorTier}
              $clickable={!!authorId}
              onClick={authorId ? handleAuthorClick : undefined}
            >
              {displayName}
            </AuthorName>
            {isFromDiscord && !hasLinkedUser && <DiscordTag>via Discord</DiscordTag>}
            <Timestamp>{formatRelativeTime(createdAt)}</Timestamp>
            {isEdited && <EditedTag>(edited)</EditedTag>}
          </MessageHeader>
        )}

        {isEditing ? (
          <EditInput
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            autoFocus
          />
        ) : (
          <>
            {content && (
              <MessageTextWrapper>
                <MessageMarkdown content={content} />
                {isGrouped && isEdited && <InlineEditedTag>(edited)</InlineEditedTag>}
              </MessageTextWrapper>
            )}
            {embeds && embeds.length > 0 && <MessageEmbeds embeds={embeds} />}
          </>
        )}
      </MessageContent>

      {showMenu && (isOwnMessage || isCreator) && (
        <ActionMenu>
          {onReply && (
            <ActionButton onClick={() => onReply(id)} title="Reply">
              <Reply size={14} />
            </ActionButton>
          )}
          {isOwnMessage && onEdit && (
            <ActionButton onClick={() => setIsEditing(true)} title="Edit">
              <Edit2 size={14} />
            </ActionButton>
          )}
          {isCreator && onPin && (
            <ActionButton onClick={() => onPin(id)} title={isPinned ? "Unpin" : "Pin"}>
              <Pin size={14} />
            </ActionButton>
          )}
          {(isOwnMessage || isCreator) && onDelete && (
            <ActionButton onClick={() => onDelete(id)} title="Delete" $danger>
              <Trash2 size={14} />
            </ActionButton>
          )}
        </ActionMenu>
      )}
    </MessageContainer>
  );
}

// Styled Components
const MessageContainer = styled.div<{ $isPinned?: boolean; $isGrouped?: boolean }>`
  display: flex;
  gap: 0.75rem;
  padding: ${(props) => (props.$isGrouped ? "0.125rem 1rem" : "0.5rem 1rem")};
  padding-top: ${(props) => (props.$isGrouped ? "0.125rem" : "0.5rem")};
  margin-top: ${(props) => (props.$isGrouped ? "0" : "0")};
  background: ${(props) =>
    props.$isPinned ? "rgba(250, 168, 26, 0.05)" : "transparent"};
  border-left: ${(props) =>
    props.$isPinned ? `2px solid ${LOUNGE_COLORS.goldPrimary}` : "2px solid transparent"};
  position: relative;

  &:hover {
    background: ${(props) => props.theme.background === "#fff" ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)"};
  }

  &:hover .grouped-timestamp {
    opacity: 1;
  }

  @media (max-width: 768px) {
    gap: 0.5rem;
    padding: ${(props) => (props.$isGrouped ? "0.125rem 0.75rem" : "0.375rem 0.75rem")};
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 40px;

  @media (max-width: 768px) {
    width: 32px;
  }
`;

const GroupedTimestampWrapper = styled.div`
  width: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;

  @media (max-width: 768px) {
    width: 32px;
  }
`;

const GroupedTimestamp = styled.span`
  font-size: 0.55rem;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.35)" : "rgba(255, 255, 255, 0.35)"};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-align: center;
  line-height: 1;
`;

const InlineEditedTag = styled.span`
  font-size: 0.65rem;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.3)" : "rgba(255, 255, 255, 0.3)"};
  margin-left: 4px;
`;

const AvatarButton = styled.button<{ $clickable?: boolean }>`
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
  border-radius: 50%;
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    transform: ${(props) => (props.$clickable ? "scale(1.05)" : "none")};
    opacity: ${(props) => (props.$clickable ? 0.9 : 1)};
  }

  &:disabled {
    cursor: default;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: ${LOUNGE_COLORS.glassBorder};
  display: block;
  /* Prevent CLS during image load */
  aspect-ratio: 1 / 1;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
  }
`;

const DiscordBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #5865f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: #fff;
  border: 2px solid ${LOUNGE_COLORS.glassBackground};
`;

const MessageContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
`;

const AuthorName = styled.span<{ $tier: Tier; $clickable?: boolean; $customColor?: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${(props) => {
    if (props.$customColor) return props.$customColor;
    return TIER_INFO[props.$tier]?.color || "#9CA3AF";
  }};
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
  transition: opacity 0.15s ease;

  &:hover {
    opacity: ${(props) => (props.$clickable ? 0.8 : 1)};
    text-decoration: ${(props) => (props.$clickable ? "underline" : "none")};
  }

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const DiscordTag = styled.span`
  font-size: 0.65rem;
  padding: 2px 6px;
  background: rgba(88, 101, 242, 0.2);
  color: #5865f2;
  border-radius: 4px;
  font-weight: 500;
`;

const Timestamp = styled.span`
  font-size: 0.7rem;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.45)" : "rgba(255, 255, 255, 0.4)"};
`;

const EditedTag = styled.span`
  font-size: 0.65rem;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.35)" : "rgba(255, 255, 255, 0.3)"};
`;

const MessageTextWrapper = styled.div`
  font-size: 0.95rem;
  line-height: 1.4;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.85)" : "rgba(255, 255, 255, 0.9)"};
  word-break: break-word;
  /* Prevent text reflow CLS */
  overflow-wrap: break-word;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const EditInput = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  background: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.04)" : "rgba(0, 0, 0, 0.3)"};
  border: 1px solid ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.12)" : LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: ${(props) => props.theme.foreground};
  font-size: 0.95rem;
  font-family: inherit;
  resize: none;
  min-height: 40px;

  &:focus {
    outline: none;
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const ActionMenu = styled.div`
  position: absolute;
  top: 4px;
  right: 8px;
  display: flex;
  gap: 2px;
  padding: 4px;
  background: ${(props) => props.theme.background === "#fff" ? "#fff" : LOUNGE_COLORS.glassBackground};
  border: 1px solid ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.12)" : LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  box-shadow: ${(props) => props.theme.background === "#fff" ? "0 2px 8px rgba(0,0,0,0.1)" : "none"};
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: ${(props) => (props.$danger ? "#ed4245" : (props.theme.background === "#fff" ? "rgba(0,0,0,0.6)" : "rgba(255, 255, 255, 0.7)"))};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.$danger ? "rgba(237, 66, 69, 0.2)" : (props.theme.background === "#fff" ? "rgba(0,0,0,0.08)" : "rgba(255, 255, 255, 0.1)")};
    color: ${(props) => (props.$danger ? "#ed4245" : props.theme.foreground)};
  }
`;
