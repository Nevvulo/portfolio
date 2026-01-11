import { useQuery } from "convex/react";
import styled, { keyframes } from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface TypingIndicatorProps {
  channelId: Id<"channels">;
}

interface TypingUser {
  clerkId: string;
  displayName: string;
}

export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const typingUsers = useQuery(api.presence.getTyping, { channelId }) as TypingUser[] | undefined;

  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (!typingUsers || typingUsers.length === 0) return "";
    if (typingUsers.length === 1) {
      return `${typingUsers[0]?.displayName ?? "Someone"} is typing`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0]?.displayName ?? "Someone"} and ${typingUsers[1]?.displayName ?? "someone"} are typing`;
    }
    return `${typingUsers[0]?.displayName ?? "Someone"} and ${typingUsers.length - 1} others are typing`;
  };

  return (
    <IndicatorContainer>
      <DotsContainer>
        <Dot $delay={0} />
        <Dot $delay={0.2} />
        <Dot $delay={0.4} />
      </DotsContainer>
      <TypingText>{getTypingText()}</TypingText>
    </IndicatorContainer>
  );
}

// Animations
const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
`;

// Styled Components
const IndicatorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 1rem;
  min-height: 24px;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 3px;
`;

const Dot = styled.div<{ $delay: number }>`
  width: 6px;
  height: 6px;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 50%;
  animation: ${bounce} 1.4s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay}s;
`;

const TypingText = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
`;
