import { Sparkles } from "lucide-react";
import styled from "styled-components";
import { RARITY_COLORS, type Rarity } from "../../constants/rarity";

interface InventoryItemCardProps {
  item: {
    name: string;
    description: string;
    rarity: string;
    type: string;
    iconUrl?: string | null;
  };
  quantity?: number;
  isUsed?: boolean;
  onClick?: () => void;
}

export function InventoryItemCard({ item, quantity, isUsed, onClick }: InventoryItemCardProps) {
  const rarity = item.rarity as Rarity;
  const rarityConfig = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  return (
    <Card onClick={onClick} $glowColor={rarityConfig.color} $isUsed={isUsed}>
      <RarityBorder $gradient={rarityConfig.gradient} />
      <CardContent>
        {item.iconUrl ? (
          <IconImage src={item.iconUrl} alt={item.name} />
        ) : (
          <IconPlaceholder $color={rarityConfig.color}>
            <Sparkles size={24} />
          </IconPlaceholder>
        )}
        <ItemInfo>
          <ItemName>{item.name}</ItemName>
          <ItemType>{item.type}</ItemType>
        </ItemInfo>
        <RarityLabel $color={rarityConfig.color}>{rarityConfig.label}</RarityLabel>
        {quantity && quantity > 1 && <QuantityBadge>x{quantity}</QuantityBadge>}
        {isUsed && <UsedOverlay>Used</UsedOverlay>}
      </CardContent>
    </Card>
  );
}

const Card = styled.div<{ $glowColor: string; $isUsed?: boolean }>`
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${(p) => (p.$isUsed ? 0.5 : 1)};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(p) => `0 4px 20px ${p.$glowColor}33`};
  }
`;

const RarityBorder = styled.div<{ $gradient: string }>`
  height: 3px;
  background: ${(p) => p.$gradient};
`;

const CardContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
`;

const IconImage = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
`;

const IconPlaceholder = styled.div<{ $color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.$color}22;
  color: ${(p) => p.$color};
`;

const ItemInfo = styled.div`
  text-align: center;
`;

const ItemName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const ItemType = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
  text-transform: capitalize;
`;

const RarityLabel = styled.div<{ $color: string }>`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(p) => p.$color};
`;

const QuantityBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 6px;
  background: rgba(144, 116, 242, 0.3);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: white;
`;

const UsedOverlay = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
`;
