import { useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { formatDistanceToNow } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faPoll,
  faMusic,
  faVideo,
  faNewspaper,
  faClock,
  faUsers,
  faTicket,
  faTrophy,
  faCheck,
  faSpinner,
  faThumbtack,
  faTrash,
  faCrown,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useMutation, useQuery } from "convex/react";
import { LOUNGE_COLORS, CONTENT_TYPES } from "../../../constants/lounge";
import { MessageMarkdown } from "./MessageMarkdown";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Tier, ContentPostType } from "../../../types/lounge";
import { useUserPopout } from "../../../hooks/lounge/useUserPopout";
import { PostPreview } from "@/components/blog/post-preview";

const formatRelativeTime = (date: number | Date) =>
  formatDistanceToNow(date, { addSuffix: true }).replace(/^about /, "");

// Type icons for badges
const TYPE_ICONS: Record<string, IconDefinition> = {
  giveaway: faGift,
  poll: faPoll,
  music: faMusic,
  video: faVideo,
  news: faNewspaper,
};

interface MessageAuthor {
  _id?: Id<"users">;
  clerkId?: string;
  displayName: string;
  avatarUrl?: string;
  tier?: Tier;
  isCreator?: boolean;
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
  requiredTier: Tier;
  isPinned: boolean;
  createdAt: number;
}

interface EmbeddedContentPostProps {
  messageId: Id<"messages">;
  post: ContentPostData;
  author: MessageAuthor | null;
  createdAt: number;
  isPinned?: boolean;
  isOwnMessage: boolean;
  isCreator: boolean;
  onDelete?: (id: Id<"messages">) => void;
  onPin?: (id: Id<"messages">) => void;
}

export function EmbeddedContentPost({
  messageId,
  post,
  author,
  createdAt,
  isPinned,
  isOwnMessage,
  isCreator,
  onDelete,
  onPin,
}: EmbeddedContentPostProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { open: openPopout } = useUserPopout();
  const typeConfig = CONTENT_TYPES[post.type];
  const icon = TYPE_ICONS[post.type] || faNewspaper;

  const handleAuthorClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (author?._id) {
        e.preventDefault();
        e.stopPropagation();
        openPopout(author._id, e.currentTarget);
      }
    },
    [author?._id, openPopout]
  );

  const isEligibleEmbeddable = ["giveaway", "poll", "music", "video", "news"].includes(post.type);

  return (
    <Container
      $isPinned={isPinned}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Author row with avatar */}
      <AuthorSection>
        <AvatarButton
          onClick={handleAuthorClick}
          $clickable={!!author?._id}
          disabled={!author?._id}
        >
          <Avatar src={author?.avatarUrl} alt={author?.displayName ?? "Unknown"} />
        </AvatarButton>
        <AuthorInfo>
          <AuthorName
            as={author?._id ? "button" : "span"}
            $tier={author?.tier ?? "tier1"}
            $clickable={!!author?._id}
            onClick={author?._id ? handleAuthorClick : undefined}
          >
            {author?.tier === "tier2" && <FontAwesomeIcon icon={faCrown} />}
            {author?.tier === "tier1" && <FontAwesomeIcon icon={faStar} />}
            {author?.displayName ?? "Unknown"}
          </AuthorName>
          <Timestamp>{formatRelativeTime(createdAt)}</Timestamp>
          {/* {isPinned && (
            <PinnedBadge>
              <FontAwesomeIcon icon={faThumbtack} /> Pinned
            </PinnedBadge>
          )} */}
        </AuthorInfo>
      </AuthorSection>

      {/* Content Post Card */}

      {post.type === "writing" && post.content && (
        <Container style={{ marginInlineStart: 40 }}>
          <PostPreview image={post.media?.thumbnail ?? ''} slug="" title={post.title} />
        </Container>
      )}

      {isEligibleEmbeddable && <ContentCard $gradient={typeConfig.gradient} $borderColor={typeConfig.borderColor}>
        {/* Type Badge */}
        <TypeBadge $color={typeConfig.color}>
          <FontAwesomeIcon icon={icon} />
          <span>{typeConfig.badgeLabel}</span>
        </TypeBadge>

        {/* Render based on type */}

        {post.type === "giveaway" && post.giveawayData && (
          <GiveawayEmbed postId={post._id} data={post.giveawayData} title={post.title} />
        )}

        {post.type === "poll" && post.pollData && (
          <PollEmbed postId={post._id} data={post.pollData} title={post.title} />
        )}

        {/* For other content types, show title + content */}
        {!["giveaway", "poll"].includes(post.type) && (
          <>
            <PostTitle>{post.title}</PostTitle>
            {post.content && (
              <PostContent>
                <MessageMarkdown content={post.content} />
              </PostContent>
            )}
          </>
        )}
      </ContentCard>}

      {/* Action menu */}
      {showMenu && (isOwnMessage || isCreator) && (
        <ActionMenu>
          {isCreator && onPin && (
            <ActionButton onClick={() => onPin(messageId)} title={isPinned ? "Unpin" : "Pin"}>
              <FontAwesomeIcon icon={faThumbtack} />
            </ActionButton>
          )}
          {(isOwnMessage || isCreator) && onDelete && (
            <ActionButton onClick={() => onDelete(messageId)} title="Delete" $danger>
              <FontAwesomeIcon icon={faTrash} />
            </ActionButton>
          )}
        </ActionMenu>
      )}
    </Container>
  );
}

// Giveaway Embed Component
function GiveawayEmbed({
  postId,
  data,
  title,
}: {
  postId: Id<"contentPosts">;
  data: { endsAt: number; prize: string; maxEntries?: number };
  title: string;
}) {
  const enterGiveaway = useMutation(api.contentPosts.enterGiveaway);
  const entries = useQuery(api.contentPosts.getGiveawayEntries, { postId });
  const isEnded = data.endsAt < Date.now();
  const [isEntering, setIsEntering] = useState(false);

  const handleEnter = async () => {
    if (isEntering || entries?.hasEntered || isEnded) return;
    setIsEntering(true);
    try {
      await enterGiveaway({ postId });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to enter giveaway");
    } finally {
      setIsEntering(false);
    }
  };

  const timeRemaining = data.endsAt - Date.now();
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <GiveawayContainer $ended={isEnded}>
      <GiveawayGlow />
      <ShimmerBar />

      <GiveawayHeader>
        <GiveawayIconWrapper>
          <FontAwesomeIcon icon={faGift} />
        </GiveawayIconWrapper>
        <GiveawayTitleSection>
          <GiveawayLabel>GIVEAWAY</GiveawayLabel>
          <GiveawayTitle>{title}</GiveawayTitle>
        </GiveawayTitleSection>
      </GiveawayHeader>

      <GiveawayPrizeSection>
        <GiveawayPrizeLabel>
          <FontAwesomeIcon icon={faTrophy} />
          Prize
        </GiveawayPrizeLabel>
        <GiveawayPrize>{data.prize}</GiveawayPrize>
      </GiveawayPrizeSection>

      <GiveawayStats>
        <GiveawayStat>
          <FontAwesomeIcon icon={faClock} />
          <span>
            {isEnded ? (
              <EndedText>Ended</EndedText>
            ) : (
              <>
                {daysRemaining > 0 && `${daysRemaining}d `}
                {hoursRemaining}h remaining
              </>
            )}
          </span>
        </GiveawayStat>
        <GiveawayStat>
          <FontAwesomeIcon icon={faUsers} />
          <span>{entries?.totalEntries ?? 0} entries</span>
        </GiveawayStat>
        {data.maxEntries && (
          <GiveawayStat>
            <FontAwesomeIcon icon={faTicket} />
            <span>Max {data.maxEntries}</span>
          </GiveawayStat>
        )}
      </GiveawayStats>

      {!isEnded && (
        <EnterButton
          onClick={handleEnter}
          disabled={entries?.hasEntered || isEntering}
          $entered={entries?.hasEntered}
        >
          {isEntering ? (
            <>
              <SpinningIcon icon={faSpinner} />
              Entering...
            </>
          ) : entries?.hasEntered ? (
            <>
              <FontAwesomeIcon icon={faCheck} />
              You&apos;re In!
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faTicket} />
              Enter Giveaway
            </>
          )}
        </EnterButton>
      )}

      {entries?.hasEntered && !isEnded && (
        <EnteredMessage>Good luck! Winner announced when timer ends.</EnteredMessage>
      )}
    </GiveawayContainer>
  );
}

// Poll Embed Component
function PollEmbed({
  postId,
  data,
  title,
}: {
  postId: Id<"contentPosts">;
  data: { options: { id: string; text: string }[]; endsAt?: number; allowMultiple: boolean };
  title: string;
}) {
  const votePoll = useMutation(api.contentPosts.votePoll);
  const results = useQuery(api.contentPosts.getPollResults, { postId });
  const isEnded = data.endsAt ? data.endsAt < Date.now() : false;

  const handleVote = async (optionId: string) => {
    try {
      await votePoll({ postId, optionId });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to vote");
    }
  };

  const totalVotes = results?.totalVotes || 0;

  return (
    <PollContainer>
      <PollTitle>{title}</PollTitle>
      {data.options.map((option) => {
        const votes = results?.voteCounts[option.id] || 0;
        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

        return (
          <PollOption key={option.id} onClick={() => !isEnded && handleVote(option.id)}>
            <PollOptionBar style={{ width: `${percentage}%` }} />
            <PollOptionContent>
              <PollOptionText>{option.text}</PollOptionText>
              {results && (
                <PollOptionCount>
                  {votes} ({percentage.toFixed(0)}%)
                </PollOptionCount>
              )}
            </PollOptionContent>
          </PollOption>
        );
      })}
      <PollMeta>
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {data.endsAt && (
          <span>
            {" "}
            | {isEnded ? "Ended" : `Ends ${formatRelativeTime(data.endsAt)}`}
          </span>
        )}
      </PollMeta>
    </PollContainer>
  );
}

// Animations
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled Components
const Container = styled.div<{ $isPinned?: boolean }>`
  position: relative;
  padding: 0.5rem 1rem;
  background: ${(p) => (p.$isPinned ? "rgba(250, 168, 26, 0.05)" : "transparent")};
  border-left: ${(p) => (p.$isPinned ? `2px solid ${LOUNGE_COLORS.goldPrimary}` : "2px solid transparent")};

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const AvatarButton = styled.button<{ $clickable?: boolean }>`
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  border-radius: 50%;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    opacity: ${(p) => (p.$clickable ? 0.9 : 1)};
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: ${LOUNGE_COLORS.glassBorder};
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const AuthorName = styled.span<{ $tier: Tier; $clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${(p) => (p.$tier === "tier2" ? LOUNGE_COLORS.tier2 : LOUNGE_COLORS.tier1)};
  background: none;
  border: none;
  padding: 0;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};

  svg {
    font-size: 0.7rem;
  }

  &:hover {
    opacity: ${(p) => (p.$clickable ? 0.8 : 1)};
  }
`;

const Timestamp = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
`;

const PinnedBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  padding: 2px 6px;
  background: rgba(250, 168, 26, 0.15);
  color: ${LOUNGE_COLORS.goldPrimary};
  border-radius: 4px;
  font-weight: 500;

  svg {
    font-size: 0.55rem;
  }
`;

const ContentCard = styled.div<{ $gradient: string; $borderColor: string }>`
  margin-left: calc(40px + 0.75rem);
  padding: 1rem;
  background: ${(p) => p.$gradient};
  border: 1px solid ${(p) => p.$borderColor};
  border-radius: 12px;
`;

const TypeBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  background: ${(p) => p.$color}20;
  border: 1px solid ${(p) => p.$color}40;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  color: ${(p) => p.$color};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;

  svg {
    font-size: 0.7rem;
  }
`;

const PostTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem;
`;

const PostContent = styled.div`
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
`;

// Giveaway Styles
const GiveawayContainer = styled.div<{ $ended?: boolean }>`
  position: relative;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(251, 191, 36, 0.08) 100%);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 10px;
  overflow: hidden;
  opacity: ${(p) => (p.$ended ? 0.7 : 1)};
`;

const GiveawayGlow = styled.div`
  position: absolute;
  top: -50%;
  right: -20%;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.12) 0%, transparent 70%);
  pointer-events: none;
  animation: ${pulse} 4s ease-in-out infinite;
`;

const ShimmerBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #f97316, #fbbf24, #f97316);
  background-size: 200% 100%;
  animation: ${shimmer} 3s ease infinite;
`;

const GiveawayHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const GiveawayIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f97316, #fbbf24);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  box-shadow: 0 3px 10px rgba(249, 115, 22, 0.35);
`;

const GiveawayTitleSection = styled.div`
  flex: 1;
`;

const GiveawayLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 800;
  color: #f97316;
  letter-spacing: 0.12em;
  margin-bottom: 0.15rem;
`;

const GiveawayTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
`;

const GiveawayPrizeSection = styled.div`
  margin-bottom: 0.75rem;
`;

const GiveawayPrizeLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.3rem;

  svg {
    color: #fbbf24;
    font-size: 0.55rem;
  }
`;

const GiveawayPrize = styled.div`
  font-size: 1.35rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
`;

const GiveawayStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const GiveawayStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);

  svg {
    color: rgba(251, 191, 36, 0.75);
    font-size: 0.65rem;
  }
`;

const EndedText = styled.span`
  color: #ef4444;
  font-weight: 600;
`;

const EnterButton = styled.button<{ $entered?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.7rem 1rem;
  background: ${(p) =>
    p.$entered
      ? "linear-gradient(135deg, #22c55e, #16a34a)"
      : "linear-gradient(135deg, #f97316, #ea580c)"};
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  cursor: ${(p) => (p.$entered ? "default" : "pointer")};
  transition: all 0.2s ease;
  box-shadow: ${(p) =>
    p.$entered
      ? "0 3px 12px rgba(34, 197, 94, 0.35)"
      : "0 3px 12px rgba(249, 115, 22, 0.35)"};

  &:hover:not(:disabled) {
    transform: ${(p) => (p.$entered ? "none" : "translateY(-1px)")};
  }

  &:disabled {
    cursor: default;
  }

  svg {
    font-size: 0.8rem;
  }
`;

const SpinningIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 1s linear infinite;
`;

const EnteredMessage = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
  margin-top: 0.4rem;
`;

// Poll Styles
const PollContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const PollTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.5rem;
`;

const PollOption = styled.div`
  position: relative;
  padding: 0.6rem 0.8rem;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const PollOptionBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(144, 116, 242, 0.25), rgba(250, 168, 26, 0.15));
  transition: width 0.3s ease;
`;

const PollOptionContent = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PollOptionText = styled.span`
  font-size: 0.85rem;
  color: #fff;
`;

const PollOptionCount = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
`;

const PollMeta = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
  margin-top: 0.25rem;
`;

// Action Menu
const ActionMenu = styled.div`
  position: absolute;
  top: 4px;
  right: 8px;
  display: flex;
  gap: 2px;
  padding: 4px;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: ${(p) => (p.$danger ? "#ed4245" : "rgba(255, 255, 255, 0.7)")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(p) => (p.$danger ? "rgba(237, 66, 69, 0.2)" : "rgba(255, 255, 255, 0.1)")};
    color: ${(p) => (p.$danger ? "#ed4245" : "#fff")};
  }

  svg {
    font-size: 0.75rem;
  }
`;

export default EmbeddedContentPost;
