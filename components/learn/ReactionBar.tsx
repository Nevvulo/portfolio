import { useUser } from "@clerk/nextjs";
import { faHeart, faLightbulb, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, m } from "framer-motion";
import { Eraser, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ReactionToast } from "./ReactionToast";

interface ReactionBarProps {
  postId: Id<"blogPosts">;
  variant?: "hero" | "inline";
}

type ReactionType = "like" | "helpful" | "insightful";

const REACTIONS: { type: ReactionType; icon: typeof faHeart; label: string; color: string }[] = [
  { type: "like", icon: faHeart, label: "Like", color: "#ff6b6b" },
  { type: "helpful", icon: faThumbsUp, label: "Helpful", color: "#4ecdc4" },
  { type: "insightful", icon: faLightbulb, label: "Insightful", color: "#ffe66d" },
];

const HOLD_INTERVAL_START_MS = 350; // Initial interval (~3/s)
const HOLD_INTERVAL_MIN_MS = 65; // Max speed interval (~15/s)
const HOLD_RAMP_DURATION_MS = 2500; // Time to reach max speed
const BATCH_THRESHOLD = 2; // Use batch mutation when more than this many reactions
const DEBOUNCE_DELAY_MS = 150; // Wait this long after release before sending batch

// Calculate hold interval with exponential speedup
function getHoldInterval(elapsedMs: number): number {
  if (elapsedMs >= HOLD_RAMP_DURATION_MS) return HOLD_INTERVAL_MIN_MS;

  // Aggressive exponential ramp - starts slow, gets fast quickly
  const progress = elapsedMs / HOLD_RAMP_DURATION_MS;
  const exponentialProgress = progress ** 0.4; // Aggressive ease-in curve
  const range = HOLD_INTERVAL_START_MS - HOLD_INTERVAL_MIN_MS;

  return HOLD_INTERVAL_START_MS - range * exponentialProgress;
}

// Haptic feedback utilities
const haptic = {
  light: () => navigator.vibrate?.(8),
  success: () => navigator.vibrate?.(12),
  error: () => navigator.vibrate?.([40, 25, 40]),
};

// Floating +1 animation
interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  color: string;
}

export function ReactionBar({ postId, variant = "hero" }: ReactionBarProps) {
  const { isSignedIn } = useUser();
  const [shakingButton, setShakingButton] = useState<ReactionType | null>(null);
  const [glowingButton, setGlowingButton] = useState<ReactionType | null>(null);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: "", subtitle: "" });
  const [showClearDropdown, setShowClearDropdown] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clientIp, setClientIp] = useState<string | null>(null);

  // Track server count changes for reconciliation
  const lastCounts = useRef<Record<ReactionType, number>>({ like: 0, helpful: 0, insightful: 0 });

  // Pending reactions to send (accumulated during hold)
  const pendingToSendRef = useRef<Record<ReactionType, number>>({
    like: 0,
    helpful: 0,
    insightful: 0,
  });

  // Optimistic UI offset - reduced as server confirms reactions
  const [optimisticOffset, setOptimisticOffset] = useState<Record<ReactionType, number>>({
    like: 0,
    helpful: 0,
    insightful: 0,
  });

  // Track which button is being held for animation
  const [holdingType, setHoldingType] = useState<ReactionType | null>(null);
  const [bounceTick, setBounceTick] = useState(0); // Increments on each hold tick for micro-bounce

  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const floatingIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<ReactionType, HTMLButtonElement>>(new Map());
  const isHoldingRef = useRef(false);
  const currentHoldTypeRef = useRef<ReactionType | null>(null);

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
  const myReactions = useQuery(api.blogReactions.getMyReactions, { postId });
  useQuery(
    api.blogReactions.getAnonymousReactions,
    !isSignedIn && clientIp ? { postId, ip: clientIp } : "skip",
  );
  const react = useMutation(api.blogReactions.react);
  const reactBatch = useMutation(api.blogReactions.reactBatch);
  const grantReactionXp = useMutation(api.experience.grantReactionXp);
  const removeAllReactions = useMutation(api.blogReactions.removeAllFromPost);
  const removeAllHighlights = useMutation(api.contentHighlights.removeAllFromPost);

  const hasAnyReactions = myReactions && myReactions.total > 0;

  // Detect count changes - reconcile optimistic offset when server confirms
  useEffect(() => {
    if (!counts) return;

    const types: ReactionType[] = ["like", "helpful", "insightful"];
    for (const type of types) {
      const newCount = counts[type];
      const oldCount = lastCounts.current[type];
      const increase = newCount - oldCount;

      if (increase > 0) {
        // Server confirmed reactions - reduce our optimistic offset
        setOptimisticOffset((prev) => ({
          ...prev,
          [type]: Math.max(0, prev[type] - increase),
        }));
      }

      lastCounts.current[type] = newCount;
    }
  }, [counts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showClearDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowClearDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showClearDropdown]);

  const showLimitToast = useCallback((reason: "post" | "daily") => {
    setToastMessage({
      title: "Your markers used up!",
      subtitle:
        reason === "daily"
          ? "Try again in a little bit to send your thoughts."
          : "You've reached the limit for this post.",
    });
    setShowToast(true);
  }, []);

  const triggerShakeAndGlow = useCallback((type: ReactionType) => {
    setShakingButton(type);
    setGlowingButton(type);
    haptic.error();

    setTimeout(() => {
      setShakingButton(null);
      setGlowingButton(null);
    }, 500);
  }, []);

  const spawnFloatingNumber = useCallback((type: ReactionType, color: string) => {
    const button = buttonRefs.current.get(type);
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const newFloat: FloatingNumber = {
      id: floatingIdRef.current++,
      x: rect.left + rect.width / 2,
      y: rect.top,
      color,
    };

    setFloatingNumbers((prev) => [...prev, newFloat]);

    // Remove after animation completes
    setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((f) => f.id !== newFloat.id));
    }, 900);
  }, []);

  // Flush pending reactions - called after debounce or immediately for small batches
  const flushPendingReactions = useCallback(async () => {
    const pending = { ...pendingToSendRef.current };
    const totalPending = pending.like + pending.helpful + pending.insightful;

    if (totalPending === 0) return;

    // Reset pending-to-send immediately (optimistic offset remains until server confirms)
    pendingToSendRef.current = { like: 0, helpful: 0, insightful: 0 };

    // Get IP for anonymous users
    let ip = clientIp;
    if (!isSignedIn && !ip) {
      try {
        const res = await fetch("/api/client-ip");
        const data = await res.json();
        ip = data.ip;
        setClientIp(ip);
      } catch {
        // Continue anyway
      }
    }

    try {
      if (totalPending <= BATCH_THRESHOLD) {
        // Small batch - send individual mutations for responsiveness
        const types: ReactionType[] = ["like", "helpful", "insightful"];
        for (const type of types) {
          for (let i = 0; i < pending[type]; i++) {
            const result = await react({
              postId,
              type,
              ip: isSignedIn ? undefined : (ip ?? undefined),
            });

            if (result.action === "rate_limited") {
              triggerShakeAndGlow(type);
              showLimitToast(result.reason === "daily_limit" ? "daily" : "post");
              // Reset optimistic offset for remaining unsent reactions
              const remainingForType = pending[type] - i;
              setOptimisticOffset((prev) => ({
                ...prev,
                [type]: Math.max(0, prev[type] - remainingForType),
              }));
              return;
            }

            // Grant XP on first reaction
            if (isSignedIn && result.action === "added" && result.postTotal === 1) {
              grantReactionXp({ postId }).catch(console.error);
            }

            if (result.action === "added" && result.postRemaining === 0) {
              triggerShakeAndGlow(type);
              showLimitToast("post");
              // Reset optimistic offset for remaining unsent reactions of this type
              const remainingForType = pending[type] - i - 1;
              if (remainingForType > 0) {
                setOptimisticOffset((prev) => ({
                  ...prev,
                  [type]: Math.max(0, prev[type] - remainingForType),
                }));
              }
              return;
            }
          }
        }
      } else {
        // Large batch - use batch mutation
        const reactions = (["like", "helpful", "insightful"] as ReactionType[])
          .filter((type) => pending[type] > 0)
          .map((type) => ({ type, count: pending[type] }));

        const result = await reactBatch({
          postId,
          reactions,
          ip: isSignedIn ? undefined : (ip ?? undefined),
        });

        if (result.action === "rate_limited") {
          const type = reactions[0]?.type ?? "like";
          triggerShakeAndGlow(type);
          showLimitToast(result.reason === "daily_limit" ? "daily" : "post");
          // Reset optimistic offset since nothing was added
          setOptimisticOffset((prev) => ({
            like: Math.max(0, prev.like - pending.like),
            helpful: Math.max(0, prev.helpful - pending.helpful),
            insightful: Math.max(0, prev.insightful - pending.insightful),
          }));
          return;
        }

        // Grant XP if this was first reaction
        if (isSignedIn && result.postTotal === result.added) {
          grantReactionXp({ postId }).catch(console.error);
        }

        if (result.action === "partial" || result.postRemaining === 0) {
          const type = reactions[0]?.type ?? "like";
          triggerShakeAndGlow(type);
          showLimitToast(result.reason === "daily_limit" ? "daily" : "post");

          // Reset optimistic offset for reactions that weren't added
          if (result.action === "partial") {
            const notAdded = totalPending - (result.added ?? 0);
            if (notAdded > 0) {
              // Distribute the reduction across types proportionally
              setOptimisticOffset((prev) => {
                const updated = { ...prev };
                let remaining = notAdded;
                for (const { type, count } of reactions) {
                  const reduce = Math.min(remaining, count, updated[type]);
                  updated[type] = Math.max(0, updated[type] - reduce);
                  remaining -= reduce;
                  if (remaining <= 0) break;
                }
                return updated;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to flush reactions:", error);
      // Reset optimistic offset on error
      setOptimisticOffset((prev) => ({
        like: Math.max(0, prev.like - pending.like),
        helpful: Math.max(0, prev.helpful - pending.helpful),
        insightful: Math.max(0, prev.insightful - pending.insightful),
      }));
    }
  }, [
    isSignedIn,
    clientIp,
    postId,
    react,
    reactBatch,
    grantReactionXp,
    triggerShakeAndGlow,
    showLimitToast,
  ]);

  // Add a pending reaction optimistically
  const addPendingReaction = useCallback(
    (type: ReactionType, color: string) => {
      // Optimistic UI updates
      haptic.light();
      spawnFloatingNumber(type, color);

      // Increment bounce tick for micro-bounce animation
      setBounceTick((prev) => prev + 1);

      // Add to pending-to-send queue
      pendingToSendRef.current[type]++;

      // Add to optimistic offset (will be reduced when server confirms)
      setOptimisticOffset((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    },
    [spawnFloatingNumber],
  );

  const startHold = useCallback(
    (type: ReactionType, color: string) => {
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      isHoldingRef.current = true;
      currentHoldTypeRef.current = type;
      setHoldingType(type);
      setBounceTick(0); // Reset bounce tick
      holdStartTimeRef.current = Date.now();

      // Immediate first reaction (optimistic)
      addPendingReaction(type, color);

      // Recursive timeout with accelerating interval
      const scheduleNext = () => {
        if (!isHoldingRef.current) return;

        const elapsed = Date.now() - holdStartTimeRef.current;
        const interval = getHoldInterval(elapsed);

        holdTimeoutRef.current = setTimeout(() => {
          if (isHoldingRef.current) {
            addPendingReaction(type, color);
            scheduleNext();
          }
        }, interval);
      };

      scheduleNext();
    },
    [addPendingReaction],
  );

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    isHoldingRef.current = false;
    currentHoldTypeRef.current = null;
    setHoldingType(null);

    // Debounce the flush - wait a moment in case user starts holding again
    const totalPending =
      pendingToSendRef.current.like +
      pendingToSendRef.current.helpful +
      pendingToSendRef.current.insightful;

    if (totalPending > 0) {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Small batches flush immediately for responsiveness
      // Larger batches get debounced to catch rapid taps
      const delay = totalPending <= BATCH_THRESHOLD ? 0 : DEBOUNCE_DELAY_MS;

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        flushPendingReactions();
      }, delay);
    }
  }, [flushPendingReactions]);

  const handleClearPostReactions = useCallback(async () => {
    if (!isSignedIn || isClearing) return;
    setIsClearing(true);
    try {
      await removeAllReactions({ postId });
      setShowClearDropdown(false);
      haptic.success();
    } catch (error) {
      console.error("Failed to clear reactions:", error);
    } finally {
      setIsClearing(false);
    }
  }, [isSignedIn, isClearing, postId, removeAllReactions]);

  const handleClearAll = useCallback(async () => {
    if (!isSignedIn || isClearing) return;
    setIsClearing(true);
    try {
      await Promise.all([removeAllReactions({ postId }), removeAllHighlights({ postId })]);
      setShowClearDropdown(false);
      haptic.success();
    } catch (error) {
      console.error("Failed to clear all:", error);
    } finally {
      setIsClearing(false);
    }
  }, [isSignedIn, isClearing, postId, removeAllReactions, removeAllHighlights]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <Container ref={containerRef} $variant={variant}>
        {REACTIONS.map(({ type, icon, label, color }) => {
          const serverCount = counts?.[type] ?? 0;
          const optimistic = optimisticOffset[type];
          const totalCount = serverCount + optimistic; // Optimistic total
          const myCount = (myReactions?.[type] ?? 0) + optimistic;
          const isActive = myCount > 0;
          const isShaking = shakingButton === type;
          const isGlowing = glowingButton === type;
          const isHolding = holdingType === type;

          // Micro-bounce: alternate y and rotation on each tick
          const microY = isHolding ? -2 - (bounceTick % 2) * 2 : 0;
          const microRotate = isHolding ? (bounceTick % 2 === 0 ? 2 : -2) : 0;

          return (
            <GlassButton
              key={type}
              ref={(el) => {
                if (el) buttonRefs.current.set(type, el);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                startHold(type, color);
              }}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={(e) => {
                e.preventDefault();
                startHold(type, color);
              }}
              onTouchEnd={stopHold}
              title={`${label} - Hold to add more`}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <IconCircle
                $active={isActive}
                $color={color}
                $isShaking={isShaking}
                $isGlowing={isGlowing}
                $glowColor={isGlowing ? "#ef4444" : color}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <IconWrapper $active={isActive} $color={color}>
                  <FontAwesomeIcon icon={icon} />
                </IconWrapper>
              </IconCircle>
              <Count
                $active={isActive}
                $color={color}
                animate={{
                  scale: isHolding ? 1.3 : 1,
                  y: isHolding ? -8 + microY : 0,
                  rotate: microRotate,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: isHolding ? 15 : 20,
                  mass: 0.5,
                }}
              >
                {totalCount}
              </Count>
            </GlassButton>
          );
        })}

        {/* Clear button with dropdown */}
        {isSignedIn && hasAnyReactions && (
          <ClearButtonWrapper ref={dropdownRef}>
            <ClearButton
              onClick={() => setShowClearDropdown(!showClearDropdown)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              title="Clear reactions"
            >
              <ClearIconCircle $isOpen={showClearDropdown}>
                <X size={18} />
              </ClearIconCircle>
            </ClearButton>

            <AnimatePresence>
              {showClearDropdown && (
                <Dropdown
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <DropdownItem
                    onClick={handleClearAll}
                    disabled={isClearing}
                    whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Remove all reactions</span>
                    <DropdownHint>Clears highlights + reactions</DropdownHint>
                  </DropdownItem>
                  <DropdownItem
                    onClick={handleClearPostReactions}
                    disabled={isClearing}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Eraser size={14} />
                    <span>Clear post reactions</span>
                    <DropdownHint>Keeps highlights</DropdownHint>
                  </DropdownItem>
                </Dropdown>
              )}
            </AnimatePresence>
          </ClearButtonWrapper>
        )}
      </Container>

      {/* Floating +1 numbers */}
      <AnimatePresence>
        {floatingNumbers.map((float) => (
          <FloatingPlusOne
            key={float.id}
            $color={float.color}
            style={{ left: float.x, top: float.y }}
            initial={{ opacity: 0, y: 0, scale: 0.5, x: "-50%" }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -50,
              scale: 1,
              x: "-50%",
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
              opacity: { times: [0, 0.1, 0.7, 1] },
            }}
          >
            +1
          </FloatingPlusOne>
        ))}
      </AnimatePresence>

      <ReactionToast
        show={showToast}
        onHide={() => setShowToast(false)}
        title={toastMessage.title}
        subtitle={toastMessage.subtitle}
        anchorRef={containerRef}
      />
    </>
  );
}

const Container = styled.div<{ $variant: "hero" | "inline" }>`
  display: flex;
  align-items: center;
  gap: ${(props) => (props.$variant === "hero" ? "16px" : "12px")};
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0) rotate(0deg); }
  10% { transform: translateX(-3px) rotate(-2deg); }
  20% { transform: translateX(3px) rotate(2deg); }
  30% { transform: translateX(-3px) rotate(-1deg); }
  40% { transform: translateX(3px) rotate(1deg); }
  50% { transform: translateX(-2px) rotate(-1deg); }
  60% { transform: translateX(2px) rotate(1deg); }
  70% { transform: translateX(-1px) rotate(0deg); }
  80% { transform: translateX(1px) rotate(0deg); }
`;

const errorGlow = keyframes`
  0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.15); }
  50% { box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 0 24px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255,255,255,0.15); }
`;

const GlassButton = styled(m.button)`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const IconCircle = styled(m.div)<{
  $active: boolean;
  $color: string;
  $isShaking: boolean;
  $isGlowing: boolean;
  $glowColor: string;
}>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  /* iOS 26 Liquid Glass */
  background: ${(props) =>
    props.$active ? `rgba(255, 255, 255, 0.12)` : `rgba(255, 255, 255, 0.06)`};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${(props) =>
    props.$active ? `${props.$color}40` : `rgba(255, 255, 255, 0.12)`};
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);

  transition: all 0.2s ease;

  /* Hover glow */
  ${GlassButton}:hover:not(:disabled) & {
    background: rgba(255, 255, 255, 0.12);
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.15),
      0 0 20px ${(props) => props.$color}30,
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: ${(props) => props.$color}50;
  }

  /* Active/pressed glow */
  ${GlassButton}:active:not(:disabled) & {
    background: rgba(255, 255, 255, 0.15);
    box-shadow:
      0 2px 12px rgba(0, 0, 0, 0.1),
      0 0 28px ${(props) => props.$color}40,
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  /* Shake animation */
  ${(props) =>
    props.$isShaking &&
    css`
      animation: ${shake} 0.4s ease-out;
    `}

  /* Error glow animation */
  ${(props) =>
    props.$isGlowing &&
    css`
      animation: ${errorGlow} 0.4s ease-out;
    `}
`;

const IconWrapper = styled.span<{ $active: boolean; $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: ${(props) => (props.$active ? props.$color : "rgba(255, 255, 255, 0.7)")};
  transition: color 0.2s ease, transform 0.15s ease;

  ${GlassButton}:hover:not(:disabled) & {
    color: ${(props) => props.$color};
  }
`;

const Count = styled(m.span)<{
  $active: boolean;
  $color: string;
}>`
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  min-width: 16px;
  color: ${(props) => (props.$active ? props.$color : "rgba(255, 255, 255, 0.6)")};
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: color 0.2s ease;
  display: inline-block;

  ${GlassButton}:hover & {
    color: ${(props) => props.$color};
  }
`;

const FloatingPlusOne = styled(m.span)<{ $color: string }>`
  position: fixed;
  pointer-events: none;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 18px;
  color: ${(props) => props.$color};
  text-shadow: 0 2px 12px ${(props) => props.$color}80;
  z-index: 10001;
`;

// Clear button and dropdown styles
const ClearButtonWrapper = styled.div`
  position: relative;
  margin-left: 8px;
`;

const ClearButton = styled(m.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
`;

const ClearIconCircle = styled.div<{ $isOpen: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  /* iOS 26 Liquid Glass - slightly smaller */
  background: ${(props) =>
    props.$isOpen ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.06)"};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${(props) =>
    props.$isOpen ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.12)"};
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);

  transition: all 0.2s ease;
  color: ${(props) => (props.$isOpen ? "#ef4444" : "rgba(255, 255, 255, 0.5)")};

  ${ClearButton}:hover & {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.15),
      0 0 16px rgba(239, 68, 68, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
`;

const Dropdown = styled(m.div)`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  padding: 6px;
  border-radius: 12px;

  /* iOS 26 Liquid Glass */
  background: rgba(16, 13, 27, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  z-index: 100;
`;

const DropdownItem = styled(m.button)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
  }

  & > span {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const DropdownHint = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
  margin-left: 22px;
`;

export default ReactionBar;
