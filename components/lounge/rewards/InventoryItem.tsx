import { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { m } from "framer-motion";
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
  Download,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";

// Remove "about" prefix from relative time
const formatRelativeTime = (date: number | Date) =>
  formatDistanceToNow(date, { addSuffix: true }).replace(/^about /, "");
import { RARITY_COLORS, REWARD_TYPES, LOUNGE_COLORS } from "../../../constants/lounge";
import type { InventoryItem as InventoryItemType, ItemRarity } from "../../../types/lounge";

interface InventoryItemProps {
  item: InventoryItemType;
  onClaim: (itemId: string) => void;
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

export function InventoryItem({ item, onClaim }: InventoryItemProps) {
  const [copied, setCopied] = useState(false);

  const rarityColors = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS];
  const Icon = ITEM_ICONS[item.type] || Gift;
  const rewardType = REWARD_TYPES[item.type as keyof typeof REWARD_TYPES];

  const isExpired = item.expiresAt && isPast(new Date(item.expiresAt));
  const hasCode = !!item.code;
  const hasAsset = !!item.assetUrl;

  const handleClaim = () => {
    if (item.isClaimed || isExpired) return;
    onClaim(item.id);
  };

  const handleCopyCode = () => {
    if (!item.code || !item.isClaimed) return;
    navigator.clipboard.writeText(item.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      $rarity={item.rarity}
      $glowColor={rarityColors.glow}
      $isExpired={!!isExpired}
      whileHover={{ y: -2 }}
    >
      <RarityBadge $color={rarityColors.color}>{rarityColors.label}</RarityBadge>

      <IconWrapper $gradient={rarityColors.gradient}>
        <Icon size={24} />
      </IconWrapper>

      <ItemName>{item.name}</ItemName>
      <ItemType>{rewardType?.label || item.type}</ItemType>
      <ItemDescription>{item.description}</ItemDescription>

      {item.expiresAt && (
        <ExpiryInfo $isExpired={!!isExpired}>
          <AlertTriangle size={12} />
          {isExpired
            ? "Expired"
            : `Expires ${formatRelativeTime(new Date(item.expiresAt))}`}
        </ExpiryInfo>
      )}

      <ActionArea>
        {isExpired ? (
          <ExpiredBadge>Expired</ExpiredBadge>
        ) : item.isClaimed ? (
          <>
            {hasCode && (
              <CodeDisplay onClick={handleCopyCode}>
                <code>{item.code}</code>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </CodeDisplay>
            )}
            {hasAsset && (
              <DownloadButton href={item.assetUrl} target="_blank" rel="noopener">
                <Download size={14} />
                Download
              </DownloadButton>
            )}
            {!hasCode && !hasAsset && <ClaimedBadge>Claimed</ClaimedBadge>}
          </>
        ) : (
          <ClaimButton onClick={handleClaim}>
            {hasCode ? "Reveal Code" : hasAsset ? "Claim" : "Claim Reward"}
          </ClaimButton>
        )}
      </ActionArea>

      {item.isClaimed && item.claimedAt && (
        <ClaimedDate>
          Claimed {format(new Date(item.claimedAt), "MMM d, yyyy")}
        </ClaimedDate>
      )}

      {item.rarity === "legendary" && !isExpired && <LegendaryShimmer />}
    </Card>
  );
}

// Keyframes - Subtle shimmer sweep
const shimmer = keyframes`
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
`;

// Styled Components
const Card = styled(m.div)<{
  $rarity: ItemRarity;
  $glowColor: string;
  $isExpired: boolean;
}>`
  position: relative;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${(props) => (props.$isExpired ? "rgba(255, 255, 255, 0.1)" : props.$glowColor)};
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
  transition: all 0.2s;

  ${(props) =>
    props.$isExpired &&
    css`
      opacity: 0.6;
      filter: grayscale(0.5);
    `}

  &:hover {
    border-color: ${(props) => (props.$isExpired ? "rgba(255, 255, 255, 0.1)" : props.$glowColor)};
    box-shadow: ${(props) =>
      props.$isExpired ? "none" : `0 0 20px ${props.$glowColor}`};
  }
`;

const RarityBadge = styled.div<{ $color: string }>`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.125rem 0.375rem;
  background: ${(props) => props.$color};
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 4px;
`;

const IconWrapper = styled.div<{ $gradient: string }>`
  width: 48px;
  height: 48px;
  background: ${(props) => props.$gradient};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 0.75rem;
`;

const ItemName = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.125rem;
`;

const ItemType = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const ItemDescription = styled.p`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 0.75rem;
  line-height: 1.4;
  flex: 1;
`;

const ExpiryInfo = styled.div<{ $isExpired: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: ${(props) => (props.$isExpired ? "#ef4444" : "#f59e0b")};
  margin-bottom: 0.75rem;
`;

const ActionArea = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ClaimButton = styled.button`
  width: 100%;
  padding: 0.5rem;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, #6b69d6);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(144, 116, 242, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const CodeDisplay = styled.button`
  width: 100%;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  code {
    font-family: monospace;
    font-size: 0.75rem;
    color: ${LOUNGE_COLORS.tier2};
    overflow: hidden;
    text-overflow: ellipsis;
  }

  svg {
    color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DownloadButton = styled.a`
  width: 100%;
  padding: 0.5rem;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  }
`;

const ClaimedBadge = styled.div`
  padding: 0.5rem;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  text-align: center;
`;

const ExpiredBadge = styled.div`
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  text-align: center;
`;

const ClaimedDate = styled.div`
  margin-top: 0.5rem;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
`;

const LegendaryShimmer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: 12px;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.08),
      transparent
    );
    animation: ${shimmer} 3s ease-in-out infinite;
    animation-delay: 1s;
  }
`;
