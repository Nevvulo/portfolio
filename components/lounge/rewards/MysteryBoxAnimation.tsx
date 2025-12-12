import { useState, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { m, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, X } from "lucide-react";
import { RARITY_COLORS, RARITY_ORDER } from "../../../constants/lounge";
import { ItemReveal } from "./ItemReveal";
import { ParticleEffect } from "./ParticleEffect";
import type { Reward, MysteryBoxState } from "../../../types/lounge";

interface MysteryBoxAnimationProps {
  reward: Reward;
  onComplete: () => void;
  onClose: () => void;
}

export function MysteryBoxAnimation({ reward, onComplete, onClose }: MysteryBoxAnimationProps) {
  const [state, setState] = useState<MysteryBoxState>("idle");
  const [revealedItems, setRevealedItems] = useState<number[]>([]);
  const [showParticles, setShowParticles] = useState(false);

  // Sort items by rarity (legendary first for dramatic reveal)
  const sortedItems = [...reward.items].sort(
    (a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0)
  );

  // Get the best rarity for glow color during shake
  const bestRarity = sortedItems[0]?.rarity || "common";
  const bestRarityColors = RARITY_COLORS[bestRarity as keyof typeof RARITY_COLORS];

  const startOpening = useCallback(() => {
    if (state !== "idle") return;

    // Phase 1: Shaking
    setState("shaking");

    // Phase 2: Opening (after 2.5 seconds of shaking)
    setTimeout(() => {
      setState("opening");
      setShowParticles(true);
    }, 2500);

    // Phase 3: Revealing items (after opening animation)
    setTimeout(() => {
      setState("revealing");
    }, 3000);
  }, [state]);

  // Reveal items one by one
  useEffect(() => {
    if (state !== "revealing") return;

    const revealNext = () => {
      setRevealedItems((prev) => {
        if (prev.length >= sortedItems.length) {
          // All items revealed
          setTimeout(() => {
            setState("complete");
            onComplete();
          }, 500);
          return prev;
        }
        return [...prev, prev.length];
      });
    };

    // Stagger reveals by 700ms each
    const timer = setInterval(revealNext, 700);
    revealNext(); // Start immediately

    return () => clearInterval(timer);
  }, [state, sortedItems.length, onComplete]);

  // Hide particles after animation
  useEffect(() => {
    if (showParticles) {
      const timer = setTimeout(() => setShowParticles(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showParticles]);

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <CloseButton onClick={onClose}>
        <X size={24} />
      </CloseButton>

      <Content>
        <AnimatePresence mode="wait">
          {(state === "idle" || state === "shaking") && (
            <BoxContainer
              key="box"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                $isShaking={state === "shaking"}
                $glowColor={bestRarityColors.glow}
                $glowIntense={bestRarityColors.glowIntense}
                onClick={startOpening}
              >
                <BoxInner>
                  <Gift size={64} />
                  <Sparkles className="sparkle sparkle-1" size={20} />
                  <Sparkles className="sparkle sparkle-2" size={16} />
                  <Sparkles className="sparkle sparkle-3" size={18} />
                </BoxInner>
                {state === "idle" && <ClickHint>Click to open!</ClickHint>}
              </Box>
            </BoxContainer>
          )}

          {state === "opening" && (
            <OpeningFlash
              key="flash"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              $color={bestRarityColors.color}
            />
          )}

          {(state === "revealing" || state === "complete") && (
            <ItemsContainer
              key="items"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ItemsTitle>
                {state === "complete" ? "You received:" : "Revealing..."}
              </ItemsTitle>
              <ItemsGrid $count={sortedItems.length}>
                {sortedItems.map((item, index) => (
                  <ItemReveal
                    key={item.id}
                    item={item}
                    isRevealed={revealedItems.includes(index)}
                    delay={index * 0.1}
                  />
                ))}
              </ItemsGrid>
              {state === "complete" && (
                <CompleteButton
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={onClose}
                >
                  Claim Rewards
                </CompleteButton>
              )}
            </ItemsContainer>
          )}
        </AnimatePresence>

        {showParticles && (
          <ParticleEffect
            color={bestRarityColors.color}
            count={bestRarityColors.particleCount}
          />
        )}
      </Content>
    </Overlay>
  );
}

// Keyframes
const shake = keyframes`
  0%, 100% { transform: translateX(0) rotate(0deg); }
  10% { transform: translateX(-3px) rotate(-1deg); }
  20% { transform: translateX(3px) rotate(1deg); }
  30% { transform: translateX(-3px) rotate(-1deg); }
  40% { transform: translateX(3px) rotate(1deg); }
  50% { transform: translateX(-3px) rotate(-1deg); }
  60% { transform: translateX(3px) rotate(1deg); }
  70% { transform: translateX(-3px) rotate(-1deg); }
  80% { transform: translateX(3px) rotate(1deg); }
  90% { transform: translateX(-3px) rotate(-1deg); }
`;

const intenseShake = keyframes`
  0%, 100% { transform: translateX(0) rotate(0deg) scale(1); }
  10% { transform: translateX(-5px) rotate(-2deg) scale(1.02); }
  20% { transform: translateX(5px) rotate(2deg) scale(1); }
  30% { transform: translateX(-5px) rotate(-2deg) scale(1.02); }
  40% { transform: translateX(5px) rotate(2deg) scale(1); }
  50% { transform: translateX(-5px) rotate(-2deg) scale(1.02); }
  60% { transform: translateX(5px) rotate(2deg) scale(1); }
  70% { transform: translateX(-5px) rotate(-2deg) scale(1.02); }
  80% { transform: translateX(5px) rotate(2deg) scale(1); }
  90% { transform: translateX(-5px) rotate(-2deg) scale(1.02); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

// Styled Components
const Overlay = styled(m.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
`;

const Content = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const BoxContainer = styled(m.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Box = styled.div<{ $isShaking: boolean; $glowColor: string; $glowIntense: string }>`
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #2a2040, #1a1030);
  border: 3px solid rgba(144, 116, 242, 0.5);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;

  ${(props) =>
    props.$isShaking
      ? css`
          animation: ${shake} 0.2s ease-in-out infinite,
            ${intenseShake} 0.15s ease-in-out 1.5s infinite;
          box-shadow: 0 0 40px ${props.$glowColor}, 0 0 80px ${props.$glowIntense};
          border-color: ${props.$glowIntense};
        `
      : css`
          &:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px ${props.$glowColor};
          }
        `}

  &::before {
    content: "";
    position: absolute;
    inset: -4px;
    border-radius: 28px;
    background: linear-gradient(
      135deg,
      rgba(144, 116, 242, 0.3),
      rgba(247, 190, 92, 0.3)
    );
    z-index: -1;
    animation: ${pulse} 2s ease-in-out infinite;
    opacity: ${(props) => (props.$isShaking ? 1 : 0.5)};
  }
`;

const BoxInner = styled.div`
  position: relative;
  color: rgba(255, 255, 255, 0.9);

  .sparkle {
    position: absolute;
    color: #fbbf24;
    animation: ${sparkle} 1.5s ease-in-out infinite;
  }

  .sparkle-1 {
    top: -20px;
    right: -15px;
    animation-delay: 0s;
  }

  .sparkle-2 {
    top: -10px;
    left: -20px;
    animation-delay: 0.5s;
  }

  .sparkle-3 {
    bottom: -15px;
    right: -10px;
    animation-delay: 1s;
  }
`;

const ClickHint = styled.div`
  position: absolute;
  bottom: -40px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const OpeningFlash = styled(m.div)<{ $color: string }>`
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, ${(props) => props.$color}, transparent);
  border-radius: 50%;
`;

const ItemsContainer = styled(m.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
`;

const ItemsTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const ItemsGrid = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => Math.min(props.$count, 3)}, 1fr);
  gap: 1.5rem;
  max-width: 600px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const CompleteButton = styled(m.button)`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #9074f2, #6b69d6);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(144, 116, 242, 0.4);
  }
`;
