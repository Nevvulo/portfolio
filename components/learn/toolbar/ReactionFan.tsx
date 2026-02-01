import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, m } from "framer-motion";
import { Heart, Lightbulb, Smile, ThumbsUp } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { LOUNGE_COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

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

// Track recent reactions for animation intensity
interface ReactionTracker {
  timestamps: number[];
  lastCount: Record<ReactionType, number>;
}

// Calculate animation intensity based on recent reaction velocity (0-1)
function getAnimationIntensity(timestamps: number[]): number {
  const now = Date.now();
  const windowMs = 3000; // 3 second window
  const recentCount = timestamps.filter((t) => now - t < windowMs).length;
  // Normalize: 1 reaction = 0.3, 5+ reactions = 1.0
  return Math.min(1, 0.3 + (recentCount - 1) * 0.175);
}

export function ReactionFan({
  postId,
  isExpanded,
  onToggle,
  expandDirection = "right",
}: ReactionFanProps) {
  const { isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [clientIp, setClientIp] = useState<string | null>(null);
  const hasGrantedXp = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track reaction animations
  const [punchingTypes, setPunchingTypes] = useState<Record<ReactionType, number>>({
    like: 0,
    helpful: 0,
    insightful: 0,
  });
  const reactionTracker = useRef<ReactionTracker>({
    timestamps: [],
    lastCount: { like: 0, helpful: 0, insightful: 0 },
  });

  // Fetch client IP for anonymous reactions
  useEffect(() => {
    if (!isSignedIn) {
      fetch("/api/client-ip")
        .then((res) => res.json())
        .then((data) => setClientIp(data.ip))
        .catch(() => setClientIp(null));
    }
  }, [isSignedIn]);

  const counts = useQuery(api.blogReactions.getCounts, { postId });
  const myReaction = useQuery(api.blogReactions.getMyReaction, { postId });
  const anonymousReactions = useQuery(
    api.blogReactions.getAnonymousReactions,
    !isSignedIn && clientIp ? { postId, ip: clientIp } : "skip",
  );
  const react = useMutation(api.blogReactions.react);
  const grantReactionXp = useMutation(api.experience.grantReactionXp);

  const totalReactions = counts ? counts.like + counts.helpful + counts.insightful : 0;

  // Detect count changes and trigger punch animation
  useEffect(() => {
    if (!counts) return;

    const tracker = reactionTracker.current;
    const types: ReactionType[] = ["like", "helpful", "insightful"];

    for (const type of types) {
      const newCount = counts[type];
      const oldCount = tracker.lastCount[type];

      if (newCount > oldCount) {
        // Count increased - trigger punch animation
        tracker.timestamps.push(Date.now());
        // Keep only recent timestamps
        tracker.timestamps = tracker.timestamps.filter((t) => Date.now() - t < 5000);

        const intensity = getAnimationIntensity(tracker.timestamps);
        setPunchingTypes((prev) => ({ ...prev, [type]: intensity }));

        // Clear animation after duration
        setTimeout(() => {
          setPunchingTypes((prev) => ({ ...prev, [type]: 0 }));
        }, 500);
      }

      tracker.lastCount[type] = newCount;
    }
  }, [counts]);

  // Allow reactions - backend handles rate limiting
  // For anonymous: check if we have remaining budget (or haven't loaded yet, optimistically allow)
  const anonHasBudget = !anonymousReactions || anonymousReactions.postRemaining > 0;
  const canReact = isSignedIn || anonHasBudget;

  const handleReact = async (type: ReactionType) => {
    if (isLoading) return;

    const hadNoReaction = !myReaction;

    setIsLoading(true);
    try {
      // For anonymous users, fetch IP on-demand if not already loaded
      let ip = clientIp;
      if (!isSignedIn && !ip) {
        try {
          const res = await fetch("/api/client-ip");
          const data = await res.json();
          ip = data.ip;
          setClientIp(ip);
        } catch {
          // If IP fetch fails, still try (backend will handle)
        }
      }

      await react({
        postId,
        type,
        ip: isSignedIn ? undefined : (ip ?? undefined),
      });
      if (isSignedIn && hadNoReaction && !hasGrantedXp.current) {
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
        $reactionColor={
          myReaction ? REACTIONS.find((r) => r.type === myReaction)?.color : undefined
        }
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="React to this post"
      >
        <Smile size={18} />
        {totalReactions > 0 && <Badge>{totalReactions > 99 ? "99+" : totalReactions}</Badge>}
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

              const punchIntensity = punchingTypes[reaction.type];

              return (
                <ReactionButton
                  key={reaction.type}
                  onClick={() => handleReact(reaction.type)}
                  disabled={!canReact || isLoading}
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
                  {count > 0 && (
                    <ReactionCount
                      $color={reaction.color}
                      $isPunching={punchIntensity > 0}
                      $intensity={punchIntensity}
                    >
                      {count}
                    </ReactionCount>
                  )}
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
    props.$expandDirection === "left" ? `right: 0; width: 200px;` : `left: 0; width: 200px;`}
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
    props.$hasReaction && props.$reactionColor ? props.$reactionColor : "rgba(255, 255, 255, 0.7)"};

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
  ${(props) => (props.$expandDirection === "left" ? "right: 100%;" : "left: 100%;")}
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  ${(props) => (props.$expandDirection === "left" ? "margin-right: 8px;" : "margin-left: 8px;")}
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
  ${(props) => (props.$expandDirection === "left" ? "right: 10px;" : "left: 10px;")}
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  background: ${(props) => (props.$isActive ? `${props.$color}33` : "rgba(255, 255, 255, 0.08)")};
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

// Punch animation keyframes - scales up and moves up, then settles back
const punchAnimation = keyframes`
  0% {
    transform: scale(1) translateY(0);
  }
  25% {
    transform: scale(var(--punch-scale)) translateY(var(--punch-y));
  }
  50% {
    transform: scale(calc(var(--punch-scale) * 0.9)) translateY(calc(var(--punch-y) * 0.6));
  }
  100% {
    transform: scale(1) translateY(0);
  }
`;

const ReactionCount = styled.span<{
  $color: string;
  $isPunching?: boolean;
  $intensity?: number;
}>`
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

  /* Punch animation with intensity-based values */
  --punch-scale: ${(props) => 1 + (props.$intensity || 0) * 0.5};
  --punch-y: ${(props) => -4 - (props.$intensity || 0) * 8}px;

  ${(props) =>
    props.$isPunching &&
    css`
      animation: ${punchAnimation} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    `}
`;

export default ReactionFan;
