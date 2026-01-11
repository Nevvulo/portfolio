import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCalendarAlt,
  faCheck,
  faClock,
  faCrown,
  faFileAlt,
  faGamepad,
  faGift,
  faLightbulb,
  faMapMarkerAlt,
  faMusic,
  faNewspaper,
  faPoll,
  faSmile,
  faSpinner,
  faThumbtack,
  faTicket,
  faTrophy,
  faUsers,
  faVideo,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery } from "convex/react";
import { format, formatDistanceToNow } from "date-fns";
import { memo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { CONTENT_TYPES, LOUNGE_COLORS } from "../../../constants/lounge";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MessageMarkdown } from "../chat/MessageMarkdown";
import { AudioPlayer } from "./AudioPlayer";

// Remove "about" prefix from relative time
const formatRelativeTime = (date: number | Date) =>
  formatDistanceToNow(date, { addSuffix: true }).replace(/^about /, "");

// FontAwesome icon mapping
const FA_ICONS: Record<string, IconDefinition> = {
  music: faMusic,
  video: faVideo,
  writing: faFileAlt,
  game_build: faGamepad,
  news: faNewspaper,
  tools: faWrench,
  event: faCalendarAlt,
  advice: faLightbulb,
  giveaway: faGift,
  poll: faPoll,
  emoji: faSmile,
};

type ContentType = keyof typeof CONTENT_TYPES;

interface ContentPostProps {
  post: {
    _id: Id<"contentPosts">;
    type: ContentType;
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
    requiredTier: "tier1" | "tier2";
    isPinned: boolean;
    createdAt: number;
    author: {
      _id: Id<"users">;
      displayName: string;
      avatarUrl?: string;
      tier: "tier1" | "tier2";
      isCreator: boolean;
    } | null;
  };
}

export const ContentPost = memo(function ContentPost({ post }: ContentPostProps) {
  const typeConfig = CONTENT_TYPES[post.type];
  const icon = FA_ICONS[post.type] || faNewspaper;

  return (
    <PostContainer
      $isPinned={post.isPinned}
      $gradient={typeConfig.gradient}
      $borderColor={typeConfig.borderColor}
    >
      {/* Header with type badge */}
      <PostHeader>
        <TypeBadge $color={typeConfig.color}>
          <FontAwesomeIcon icon={icon} />
          <span>{typeConfig.badgeLabel}</span>
        </TypeBadge>
        {post.requiredTier === "tier2" && (
          <TierBadge>
            <FontAwesomeIcon icon={faCrown} />
            VIP
          </TierBadge>
        )}
        {post.isPinned && (
          <PinnedBadge>
            <FontAwesomeIcon icon={faThumbtack} />
            Pinned
          </PinnedBadge>
        )}
        <PostTime>{formatRelativeTime(post.createdAt)}</PostTime>
      </PostHeader>

      {/* Author */}
      {post.author && (
        <AuthorRow>
          <AuthorAvatar src={post.author.avatarUrl} alt={post.author.displayName} />
          <AuthorName $tier={post.author.tier}>{post.author.displayName}</AuthorName>
        </AuthorRow>
      )}

      {/* Title */}
      <PostTitle>{post.title}</PostTitle>

      {/* Type-specific content */}
      {post.type === "emoji" && post.emojiData && (
        <EmojiBlast>
          <EmojiDisplay>{post.emojiData.emoji}</EmojiDisplay>
          {post.emojiData.message && (
            <EmojiMessage>
              {post.author?.displayName} {post.emojiData.message}
            </EmojiMessage>
          )}
        </EmojiBlast>
      )}

      {post.type === "music" && post.media && (
        <AudioPlayer
          src={post.media.url}
          title={post.title}
          thumbnail={post.media.thumbnail}
          duration={post.media.duration}
          soundcloudUrl={post.media.soundcloudUrl}
        />
      )}

      {post.type === "video" && post.media && (
        <VideoContainer>
          <video src={post.media.url} poster={post.media.thumbnail} controls preload="metadata" />
        </VideoContainer>
      )}

      {post.type === "event" && post.eventData && (
        <EventCard>
          <EventDateTime>
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>{format(post.eventData.startTime, "EEEE, MMMM d, yyyy")}</span>
          </EventDateTime>
          <EventTime>
            <FontAwesomeIcon icon={faClock} />
            <span>
              {format(post.eventData.startTime, "h:mm a")}
              {post.eventData.endTime && ` - ${format(post.eventData.endTime, "h:mm a")}`}
              {` (${post.eventData.timezone.replace("_", " ")})`}
            </span>
          </EventTime>
          {post.eventData.location && (
            <EventLocation>
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>{post.eventData.location}</span>
            </EventLocation>
          )}
        </EventCard>
      )}

      {post.type === "giveaway" && post.giveawayData && (
        <GiveawayCard postId={post._id} data={post.giveawayData} />
      )}

      {post.type === "poll" && post.pollData && <PollCard postId={post._id} data={post.pollData} />}

      {/* Main content */}
      {post.type !== "emoji" && (
        <PostContent>
          <MessageMarkdown content={post.content} />
        </PostContent>
      )}

      {/* Media thumbnail for non-player types */}
      {post.media?.thumbnail && !["music", "video"].includes(post.type) && (
        <MediaThumbnail src={post.media.thumbnail} alt={post.title} />
      )}
    </PostContainer>
  );
});

// Giveaway Card Component - Completely redesigned
function GiveawayCard({
  postId,
  data,
}: {
  postId: Id<"contentPosts">;
  data: { endsAt: number; prize: string; maxEntries?: number };
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
      {/* Decorative elements */}
      <GiveawayGlow />

      {/* Header with icon */}
      <GiveawayHeader>
        <GiveawayIconWrapper>
          <FontAwesomeIcon icon={faGift} />
        </GiveawayIconWrapper>
        <GiveawayLabel>GIVEAWAY</GiveawayLabel>
      </GiveawayHeader>

      {/* Prize - BIG emphasis */}
      <GiveawayPrizeSection>
        <GiveawayPrizeLabel>
          <FontAwesomeIcon icon={faTrophy} />
          Prize
        </GiveawayPrizeLabel>
        <GiveawayPrize>{data.prize}</GiveawayPrize>
      </GiveawayPrizeSection>

      {/* Stats row */}
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

      {/* Enter button */}
      {!isEnded && (
        <EnterButtonWrapper>
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
          {entries?.hasEntered && (
            <EnteredMessage>Good luck! Winner announced when timer ends.</EnteredMessage>
          )}
        </EnterButtonWrapper>
      )}

      {isEnded && <EndedMessage>This giveaway has ended. Stay tuned for more!</EndedMessage>}
    </GiveawayContainer>
  );
}

// Poll Card Component
function PollCard({
  postId,
  data,
}: {
  postId: Id<"contentPosts">;
  data: { options: { id: string; text: string }[]; endsAt?: number; allowMultiple: boolean };
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
          <span> | {isEnded ? "Ended" : `Ends ${formatRelativeTime(data.endsAt)}`}</span>
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
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled Components
const PostContainer = styled.div<{ $isPinned?: boolean; $gradient: string; $borderColor: string }>`
  position: relative;
  padding: 1.25rem;
  background: ${(p) => (p.$isPinned ? "rgba(250, 168, 26, 0.05)" : p.$gradient)};
  border: 1px solid ${(p) => (p.$isPinned ? LOUNGE_COLORS.goldPrimary : p.$borderColor)};
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
`;

const TypeBadge = styled.div<{ $color: string }>`
  display: flex;
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

  svg {
    font-size: 0.7rem;
  }
`;

const TierBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(250, 168, 26, 0.2);
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  color: ${LOUNGE_COLORS.tier2};

  svg {
    font-size: 0.6rem;
  }
`;

const PinnedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(250, 168, 26, 0.15);
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  color: ${LOUNGE_COLORS.goldPrimary};

  svg {
    font-size: 0.6rem;
  }
`;

const PostTime = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  margin-left: auto;
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const AuthorAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  background: ${LOUNGE_COLORS.glassBorder};
`;

const AuthorName = styled.span<{ $tier: "tier1" | "tier2" }>`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${(p) => (p.$tier === "tier2" ? LOUNGE_COLORS.tier2 : LOUNGE_COLORS.tier1)};
`;

const PostTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.75rem;
`;

const PostContent = styled.div`
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
`;

const MediaThumbnail = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 8px;
  margin-top: 1rem;
`;

const VideoContainer = styled.div`
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;

  video {
    width: 100%;
    max-height: 400px;
    background: #000;
  }
`;

// Emoji Blast Styles
const EmojiBlast = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  margin-bottom: 0.75rem;
`;

const EmojiDisplay = styled.div`
  font-size: 5rem;
  line-height: 1;
`;

const EmojiMessage = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
`;

// Event Styles
const EventCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  margin-bottom: 0.75rem;
`;

const EventDateTime = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;

  svg {
    color: ${CONTENT_TYPES.event.color};
  }
`;

const EventTime = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);

  svg {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const EventLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: ${LOUNGE_COLORS.tier1};

  svg {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

// Giveaway Styles - Completely redesigned
const GiveawayContainer = styled.div<{ $ended?: boolean }>`
  position: relative;
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(249, 115, 22, 0.15) 0%,
    rgba(234, 88, 12, 0.08) 50%,
    rgba(251, 191, 36, 0.12) 100%
  );
  border: 2px solid rgba(249, 115, 22, 0.4);
  border-radius: 12px;
  margin-bottom: 0.75rem;
  overflow: hidden;
  opacity: ${(p) => (p.$ended ? 0.7 : 1)};

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #f97316, #fbbf24, #f97316);
    background-size: 200% 100%;
    animation: ${shimmer} 3s ease infinite;
  }
`;

const GiveawayGlow = styled.div`
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
  pointer-events: none;
  animation: ${pulse} 4s ease-in-out infinite;
`;

const GiveawayHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const GiveawayIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f97316, #fbbf24);
  border-radius: 10px;
  color: #fff;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
`;

const GiveawayLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 800;
  color: #f97316;
  letter-spacing: 0.15em;
`;

const GiveawayPrizeSection = styled.div`
  margin-bottom: 1.25rem;
`;

const GiveawayPrizeLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;

  svg {
    color: #fbbf24;
    font-size: 0.65rem;
  }
`;

const GiveawayPrize = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const GiveawayStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
`;

const GiveawayStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);

  svg {
    color: rgba(251, 191, 36, 0.8);
    font-size: 0.75rem;
  }
`;

const EndedText = styled.span`
  color: #ef4444;
  font-weight: 600;
`;

const EnterButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EnterButton = styled.button<{ $entered?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: ${(p) =>
    p.$entered
      ? "linear-gradient(135deg, #22c55e, #16a34a)"
      : "linear-gradient(135deg, #f97316, #ea580c)"};
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  cursor: ${(p) => (p.$entered ? "default" : "pointer")};
  transition: all 0.2s ease;
  box-shadow: ${(p) =>
    p.$entered ? "0 4px 16px rgba(34, 197, 94, 0.4)" : "0 4px 16px rgba(249, 115, 22, 0.4)"};

  &:hover:not(:disabled) {
    transform: ${(p) => (p.$entered ? "none" : "translateY(-2px)")};
    box-shadow: ${(p) =>
      p.$entered ? "0 4px 16px rgba(34, 197, 94, 0.4)" : "0 6px 20px rgba(249, 115, 22, 0.5)"};
  }

  &:disabled {
    cursor: default;
  }

  svg {
    font-size: 0.9rem;
  }
`;

const SpinningIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 1s linear infinite;
`;

const EnteredMessage = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
`;

const EndedMessage = styled.div`
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
`;

// Poll Styles
const PollContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const PollOption = styled.div`
  position: relative;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
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
  background: linear-gradient(90deg, rgba(144, 116, 242, 0.3), rgba(250, 168, 26, 0.2));
  transition: width 0.3s ease;
`;

const PollOptionContent = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PollOptionText = styled.span`
  font-size: 0.9rem;
  color: #fff;
`;

const PollOptionCount = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`;

const PollMeta = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-top: 0.25rem;
`;

export default ContentPost;
