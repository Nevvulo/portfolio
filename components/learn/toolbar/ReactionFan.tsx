import React, { useState, useRef } from "react";
import styled from "styled-components";
import { m, AnimatePresence } from "framer-motion";
import { Heart, ThumbsUp, Lightbulb, Smile } from "lucide-react";
import { LOUNGE_COLORS } from "@/constants/lounge";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

type ReactionType = "like" | "helpful" | "insightful";

const REACTIONS: { type: ReactionType; icon: React.ReactNode; label: string; color: string }[] = [
  { type: "like", icon: <Heart size={16} />, label: "Like", color: "#ff6b6b" },
  { type: "helpful", icon: <ThumbsUp size={16} />, label: "Helpful", color: "#4ecdc4" },
  { type: "insightful", icon: <Lightbulb size={16} />, label: "Insightful", color: "#ffe66d" },
];

interface ReactionFanProps {
  postId: Id<"blogPosts">;
  isExpanded: boolean;
  onToggle: () => void;
  expandDirection?: "right" | "left";
}

export function ReactionFan({ postId, isExpanded, onToggle, expandDirection = "right" }: ReactionFanProps) {
  const { isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const hasGrantedXp = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const counts = useQuery(api.blogReactions.getCounts, { postId });
  const myReaction = useQuery(api.blogReactions.getMyReaction, { postId });
  const react = useMutation(api.blogReactions.react);
  const grantReactionXp = useMutation(api.experience.grantReactionXp);

  const totalReactions = counts ? counts.like + counts.helpful + counts.insightful : 0;

  const handleReact = async (type: ReactionType) => {
    if (!isSignedIn || isLoading) return;

    const hadNoReaction = !myReaction;

    setIsLoading(true);
    try {
      await react({ postId, type });
      if (hadNoReaction && !hasGrantedXp.current) {
        hasGrantedXp.current = true;
        grantReactionXp({ postId }).catch(console.error);
      }
    } catch (error) {
      console.error("Failed to react:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container ref={containerRef} onMouseLeave={() => isExpanded && onToggle()}>
      <HoverArea $expandDirection={expandDirection} $isExpanded={isExpanded} />
      <TriggerButton
        onClick={onToggle}
        onMouseEnter={() => !isExpanded && onToggle()}
        $hasReaction={!!myReaction}
        $reactionColor={myReaction ? REACTIONS.find(r => r.type === myReaction)?.color : undefined}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title={isSignedIn ? "React to this post" : "Sign in to react"}
      >
        <Smile size={18} />
        {totalReactions > 0 && (
          <Badge>{totalReactions > 99 ? "99+" : totalReactions}</Badge>
        )}
      </TriggerButton>

      <AnimatePresence>
        {isExpanded && (
          <FanContainer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            $expandDirection={expandDirection}
          >
            {REACTIONS.map((reaction, index) => {
              const count = counts?.[reaction.type] ?? 0;
              const isActive = myReaction === reaction.type;
              const xOffset = expandDirection === "left" ? -(index * 44) : index * 44;

              return (
                <ReactionButton
                  key={reaction.type}
                  onClick={() => handleReact(reaction.type)}
                  disabled={!isSignedIn || isLoading}
                  $color={reaction.color}
                  $isActive={isActive}
                  $expandDirection={expandDirection}
                  custom={index}
                  initial={{ opacity: 0, x: expandDirection === "left" ? 8 : -8, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    x: xOffset,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, x: expandDirection === "left" ? 8 : -8, scale: 0.8 }}
                  transition={{
                    delay: index * 0.03,
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  title={`${reaction.label}${count > 0 ? ` (${count})` : ""}`}
                >
                  {reaction.icon}
                  {count > 0 && <ReactionCount $color={reaction.color}>{count}</ReactionCount>}
                </ReactionButton>
              );
            })}
          </FanContainer>
        )}
      </AnimatePresence>
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

// Invisible hover area that bridges the gap between trigger and fan
const HoverArea = styled.div<{ $expandDirection: "right" | "left"; $isExpanded: boolean }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 48px;
  pointer-events: ${(props) => (props.$isExpanded ? "auto" : "none")};
  ${(props) =>
    props.$expandDirection === "left"
      ? `right: 0; width: 200px;`
      : `left: 0; width: 200px;`}
`;

const TriggerButton = styled(m.button)<{
  $hasReaction: boolean;
  $reactionColor?: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;

  background: ${(props) =>
    props.$hasReaction && props.$reactionColor
      ? `${props.$reactionColor}22`
      : "rgba(16, 13, 27, 0.92)"};

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid
    ${(props) =>
      props.$hasReaction && props.$reactionColor
        ? `${props.$reactionColor}44`
        : LOUNGE_COLORS.glassBorder};

  color: ${(props) =>
    props.$hasReaction && props.$reactionColor
      ? props.$reactionColor
      : "rgba(255, 255, 255, 0.7)"};

  &:hover {
    background: rgba(144, 116, 242, 0.15);
    border-color: rgba(144, 116, 242, 0.3);
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 9px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FanContainer = styled(m.div)<{ $expandDirection: "right" | "left" }>`
  position: absolute;
  ${(props) => props.$expandDirection === "left" ? "right: 100%;" : "left: 100%;"}
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  ${(props) => props.$expandDirection === "left" ? "margin-right: 8px;" : "margin-left: 8px;"}
  padding: 6px 10px;
  background: rgba(16, 13, 27, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 24px;
  z-index: 10;
`;

const ReactionButton = styled(m.button)<{
  $color: string;
  $isActive: boolean;
  $expandDirection: "right" | "left";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  ${(props) => props.$expandDirection === "left" ? "right: 10px;" : "left: 10px;"}
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  background: ${(props) =>
    props.$isActive ? `${props.$color}33` : "rgba(255, 255, 255, 0.08)"};
  border: 2px solid
    ${(props) => (props.$isActive ? props.$color : "transparent")};
  color: ${(props) => (props.$isActive ? props.$color : "rgba(255, 255, 255, 0.8)")};

  &:hover:not(:disabled) {
    background: ${(props) => `${props.$color}44`};
    color: ${(props) => props.$color};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ReactionCount = styled.span<{ $color: string }>`
  position: absolute;
  bottom: -2px;
  right: -2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: ${(props) => props.$color};
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default ReactionFan;
