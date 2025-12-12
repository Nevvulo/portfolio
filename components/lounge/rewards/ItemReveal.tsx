import { m } from "framer-motion";
import styled, { keyframes, css } from "styled-components";
import {
  Smile,
  Image,
  Ticket,
  Clock,
  Megaphone,
  Sparkles,
  Music,
  Video,
  Gamepad2,
  Gift,
} from "lucide-react";
import { RARITY_COLORS, REWARD_TYPES } from "../../../constants/lounge";
import type { RewardItem, ItemRarity } from "../../../types/lounge";

interface ItemRevealProps {
  item: RewardItem;
  isRevealed: boolean;
  delay?: number;
}

const ITEM_ICONS: Record<string, any> = {
  emoji_pack: Smile,
  wallpaper: Image,
  discount_code: Ticket,
  early_access: Clock,
  shoutout: Megaphone,
  custom: Sparkles,
  music: Music,
  video: Video,
  game_key: Gamepad2,
};

export function ItemReveal({ item, isRevealed, delay = 0 }: ItemRevealProps) {
  const rarityColors = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS];
  const Icon = ITEM_ICONS[item.type] || Gift;
  const rewardType = REWARD_TYPES[item.type as keyof typeof REWARD_TYPES];

  return (
    <Container
      initial={{ scale: 0, rotateY: 180, opacity: 0 }}
      animate={
        isRevealed
          ? {
              scale: 1,
              rotateY: 0,
              opacity: 1,
              transition: {
                type: "spring",
                damping: 12,
                stiffness: 200,
                delay,
              },
            }
          : {}
      }
      $rarity={item.rarity}
      $glowColor={rarityColors.glow}
      $glowIntense={rarityColors.glowIntense}
      $gradient={rarityColors.gradient}
    >
      <RarityBadge $color={rarityColors.color}>{rarityColors.label}</RarityBadge>

      <IconWrapper $gradient={rarityColors.gradient}>
        <Icon size={32} />
      </IconWrapper>

      <ItemName>{item.name}</ItemName>
      <ItemType>{rewardType?.label || item.type}</ItemType>
      <ItemDescription>{item.description}</ItemDescription>

      {item.rarity === "legendary" && <LegendaryShimmer />}
      {item.rarity === "epic" && <EpicGlow />}
    </Container>
  );
}

// Keyframes
const shimmer = keyframes`
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
`;

const epicPulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
`;

const legendaryGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(249, 115, 22, 0.5),
                0 0 40px rgba(251, 191, 36, 0.3),
                inset 0 0 20px rgba(249, 115, 22, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(249, 115, 22, 0.7),
                0 0 60px rgba(251, 191, 36, 0.5),
                inset 0 0 30px rgba(249, 115, 22, 0.2);
  }
`;

// Styled Components
const Container = styled(m.div)<{
  $rarity: ItemRarity;
  $glowColor: string;
  $glowIntense: string;
  $gradient: string;
}>`
  position: relative;
  background: rgba(16, 13, 27, 0.9);
  border: 2px solid ${(props) => props.$glowColor};
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 160px;
  overflow: hidden;
  box-shadow: 0 0 20px ${(props) => props.$glowColor};

  ${(props) =>
    props.$rarity === "legendary" &&
    css`
      animation: ${legendaryGlow} 2s ease-in-out infinite;
    `}
`;

const RarityBadge = styled.div<{ $color: string }>`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: ${(props) => props.$color};
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 4px;
  letter-spacing: 0.5px;
`;

const IconWrapper = styled.div<{ $gradient: string }>`
  width: 64px;
  height: 64px;
  background: ${(props) => props.$gradient};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 1rem;
`;

const ItemName = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.25rem;
`;

const ItemType = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const ItemDescription = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.4;
`;

const LegendaryShimmer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: 16px;

  &::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 50%;
    height: 200%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(251, 191, 36, 0.3),
      transparent
    );
    animation: ${shimmer} 3s ease-in-out infinite;
  }
`;

const EpicGlow = styled.div`
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  opacity: 0.3;
  animation: ${epicPulse} 2s ease-in-out infinite;
  z-index: -1;
`;
