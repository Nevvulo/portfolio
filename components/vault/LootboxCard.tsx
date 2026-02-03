import styled, { keyframes } from "styled-components";

interface LootboxCardProps {
  lootbox: {
    _id: string;
    displayName: string;
    boxStyle: string;
    deliveredAt: number;
    isOpened: boolean;
  };
  onClick: () => void;
}

const BOX_EMOJIS: Record<string, string> = {
  mystery_box: "🎁",
  chest: "🧰",
  envelope: "✉️",
  crate: "📦",
};

export function LootboxCard({ lootbox, onClick }: LootboxCardProps) {
  return (
    <Card onClick={onClick}>
      <BoxIcon>{BOX_EMOJIS[lootbox.boxStyle] || "🎁"}</BoxIcon>
      <BoxName>{lootbox.displayName}</BoxName>
      <BoxHint>Click to open</BoxHint>
      <Shimmer />
    </Card>
  );
}

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const wobble = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
`;

const Card = styled.div`
  position: relative;
  background: linear-gradient(135deg, rgba(144, 116, 242, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%);
  border: 1px solid rgba(144, 116, 242, 0.3);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(144, 116, 242, 0.6);
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(144, 116, 242, 0.3);
  }

  &:hover > div:first-child {
    animation: ${wobble} 0.5s ease-in-out;
  }
`;

const BoxIcon = styled.div`
  font-size: 48px;
  line-height: 1;
`;

const BoxName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  text-align: center;
`;

const BoxHint = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
`;

const Shimmer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(144, 116, 242, 0.08) 50%,
    transparent 100%
  );
  animation: ${shimmer} 3s ease-in-out infinite;
  pointer-events: none;
`;
