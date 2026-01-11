import { format } from "date-fns";
import { m } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { LOUNGE_COLORS, RARITY_COLORS, RARITY_ORDER } from "../../../constants/lounge";
import type { Reward } from "../../../types/lounge";

interface UnopenedBoxCardProps {
  reward: Reward;
  onClick: () => void;
}

export function UnopenedBoxCard({ reward, onClick }: UnopenedBoxCardProps) {
  // Get best rarity hint for glow
  const bestRarity =
    [...reward.items].sort(
      (a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0),
    )[0]?.rarity || "common";

  const rarityColors = RARITY_COLORS[bestRarity as keyof typeof RARITY_COLORS];

  return (
    <Card
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      $glowColor={rarityColors.glow}
    >
      <BoxIcon $gradient={rarityColors.gradient}>
        <Gift size={32} />
        <SparkleIcon className="sparkle-1" size={14} />
        <SparkleIcon className="sparkle-2" size={12} />
      </BoxIcon>

      <Content>
        <Title>Mystery Box</Title>
        <Meta>
          <TypeBadge $isMonthly={reward.type === "monthly_drop"}>
            {reward.type === "monthly_drop" ? "Monthly Drop" : "Special"}
          </TypeBadge>
          <ItemCount>{reward.items.length} items</ItemCount>
        </Meta>
        <DeliveredDate>
          Delivered {format(new Date(reward.deliveredAt), "MMM d, yyyy")}
        </DeliveredDate>
      </Content>

      <OpenButton>Open</OpenButton>

      <GlowEffect $color={rarityColors.glow} />
    </Card>
  );
}

// Keyframes
const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

// Styled Components
const Card = styled(m.div)<{ $glowColor: string }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;

  &:hover {
    border-color: ${(props) => props.$glowColor};
  }
`;

const BoxIcon = styled.div<{ $gradient: string }>`
  position: relative;
  width: 56px;
  height: 56px;
  background: ${(props) => props.$gradient};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
`;

const SparkleIcon = styled(Sparkles)`
  position: absolute;
  color: #fbbf24;
  animation: ${sparkle} 2s ease-in-out infinite;

  &.sparkle-1 {
    top: -6px;
    right: -4px;
    animation-delay: 0s;
  }

  &.sparkle-2 {
    bottom: -4px;
    left: -6px;
    animation-delay: 1s;
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.25rem;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const TypeBadge = styled.span<{ $isMonthly: boolean }>`
  padding: 0.125rem 0.375rem;
  background: ${(props) =>
    props.$isMonthly ? "rgba(144, 116, 242, 0.2)" : "rgba(247, 190, 92, 0.2)"};
  color: ${(props) => (props.$isMonthly ? LOUNGE_COLORS.tier1 : LOUNGE_COLORS.tier2)};
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
`;

const ItemCount = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

const DeliveredDate = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
`;

const OpenButton = styled.div`
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, #6b69d6);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  flex-shrink: 0;
`;

const GlowEffect = styled.div<{ $color: string }>`
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    ${(props) => props.$color} 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;

  ${Card}:hover & {
    opacity: 0.1;
  }
`;
