import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { memo } from "react";
import styled, { keyframes } from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/lounge";

// Remove "about" prefix from relative time
const formatRelativeTime = (date: number | Date) =>
  formatDistanceToNow(date, { addSuffix: true }).replace(/^about /, "");

export type SystemMessageType = "system" | "emoji_blast" | "join" | "leave" | "boost";

interface SystemMessageProps {
  type: SystemMessageType;
  authorName: string;
  content: string;
  emoji?: string;
  createdAt: number;
}

/**
 * Parse emoji blast content format: "title|description|emoji"
 */
function parseEmojiBlastContent(content: string): {
  title: string;
  description: string;
  emoji: string;
} {
  const parts = content.split("|");
  return {
    title: parts[0] || "",
    description: parts[1] || "",
    emoji: parts[2] || "",
  };
}

/**
 * Single-line system message for announcements, joins, emoji blasts, etc.
 * Similar to Discord's system messages.
 */
export const SystemMessage = memo(function SystemMessage({
  type,
  authorName,
  content,
  emoji,
  createdAt,
}: SystemMessageProps) {
  // For emoji_blast, parse the structured content
  if (type === "emoji_blast") {
    const parsed = parseEmojiBlastContent(content);
    const displayEmoji = emoji || parsed.emoji;

    return (
      <Container $type={type}>
        <IconWrapper $type={type}>
          <Sparkles size={14} />
        </IconWrapper>

        <MessageContent>
          <AuthorName>{authorName}</AuthorName>
          {parsed.title && <Title>{parsed.title}</Title>}
          {parsed.description && <Text>{parsed.description}</Text>}
          {displayEmoji && <AnimatedEmoji>{displayEmoji}</AnimatedEmoji>}
        </MessageContent>

        <Timestamp>{formatRelativeTime(createdAt)}</Timestamp>
      </Container>
    );
  }

  // For other system message types
  const extractedEmoji = emoji || extractEmojiFromContent(content);
  const cleanContent = cleanMessageContent(content, extractedEmoji);

  return (
    <Container $type={type}>
      <IconWrapper $type={type}>
        {type === "boost" ? <Zap size={14} /> : <ArrowRight size={14} />}
      </IconWrapper>

      <MessageContent>
        <AuthorName>{authorName}</AuthorName>
        <Text>{cleanContent}</Text>
      </MessageContent>

      <Timestamp>{formatRelativeTime(createdAt)}</Timestamp>
    </Container>
  );
});

/**
 * Extract emoji from end of content string
 */
function extractEmojiFromContent(content: string): string | undefined {
  // Match emoji at the end of the string (including custom Discord emojis)
  const emojiRegex =
    /(?:<a?:\w+:\d+>|[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}])\s*$/u;
  const match = content.match(emojiRegex);
  return match ? match[0].trim() : undefined;
}

/**
 * Clean content by removing markdown formatting and emoji
 */
function cleanMessageContent(content: string, _emoji?: string): string {
  const cleaned = content
    // Remove markdown headers (# ## ###)
    .replace(/^#+\s*/gm, "")
    // Remove bold markers
    .replace(/\*\*/g, "")
    // Remove the emoji from the end if present
    .replace(
      /(?:<a?:\w+:\d+>|[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}])\s*$/u,
      "",
    )
    .trim();

  return cleaned;
}

// Animations
const pulseScale = keyframes`
  0% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.4);
  }
  30% {
    transform: scale(1.1);
  }
  45% {
    transform: scale(1.3);
  }
  60% {
    transform: scale(1.05);
  }
  75% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

const shake = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  10% {
    transform: rotate(-10deg);
  }
  20% {
    transform: rotate(10deg);
  }
  30% {
    transform: rotate(-10deg);
  }
  40% {
    transform: rotate(10deg);
  }
  50% {
    transform: rotate(-5deg);
  }
  60% {
    transform: rotate(5deg);
  }
  70% {
    transform: rotate(-5deg);
  }
  80% {
    transform: rotate(5deg);
  }
  90% {
    transform: rotate(-2deg);
  }
`;

const Container = styled.div<{ $type: SystemMessageType }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);

  ${(p) =>
    p.$type === "emoji_blast" &&
    `
    background: linear-gradient(90deg, rgba(250, 168, 26, 0.05) 0%, transparent 100%);
  `}

  ${(p) =>
    p.$type === "boost" &&
    `
    background: linear-gradient(90deg, rgba(144, 116, 242, 0.05) 0%, transparent 100%);
  `}
`;

const IconWrapper = styled.div<{ $type: SystemMessageType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${(p) => {
    switch (p.$type) {
      case "emoji_blast":
        return LOUNGE_COLORS.tier1;
      case "boost":
        return LOUNGE_COLORS.tier2;
      case "join":
        return "#43b581";
      case "leave":
        return "#f04747";
      default:
        return "rgba(255, 255, 255, 0.4)";
    }
  }};
`;

const MessageContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
`;

const Title = styled.span`
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
`;

const Text = styled.span`
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AnimatedEmoji = styled.span`
  display: inline-block;
  font-size: 1.5rem;
  margin-left: 4px;
  animation: ${pulseScale} 1.5s ease-in-out infinite, ${shake} 1.5s ease-in-out infinite;
  animation-delay: 0s, 0.1s;
`;

const Timestamp = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  flex-shrink: 0;
`;

export default SystemMessage;
