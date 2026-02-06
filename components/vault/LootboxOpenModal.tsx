import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useCallback, useState } from "react";
import styled, { keyframes } from "styled-components";
import { RARITY_COLORS, type Rarity } from "../../constants/rarity";
import { openLootbox } from "@/src/db/client/inventory";

interface LootboxOpenModalProps {
  lootbox: {
    id: number;
    displayName: string;
    boxStyle: string;
  };
  onClose: () => void;
  onOpened: () => void;
}

interface RevealedItem {
  id: number;
  name: string;
  rarity: string;
  iconUrl?: string | null;
  type: string;
}

const BOX_EMOJIS: Record<string, string> = {
  mystery_box: "🎁",
  chest: "🧰",
  envelope: "✉️",
  crate: "📦",
};

type Phase = "idle" | "shaking" | "opening" | "revealing" | "done";

export function LootboxOpenModal({ lootbox, onClose, onOpened }: LootboxOpenModalProps) {
  const openLootboxMutation = useMutation({
    mutationFn: (lootboxId: number) => openLootbox(lootboxId),
  });
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealedItems, setRevealedItems] = useState<RevealedItem[]>([]);
  const [revealIndex, setRevealIndex] = useState(0);

  const handleOpen = useCallback(async () => {
    setPhase("shaking");

    // Shake for 1.5s
    await new Promise((r) => setTimeout(r, 1500));
    setPhase("opening");

    try {
      const result = await openLootboxMutation.mutateAsync(lootbox.id);

      // Simulate item reveal delay
      await new Promise((r) => setTimeout(r, 800));
      setPhase("revealing");

      // For now, show item IDs - the actual items will be fetched by the parent
      // We'll use a simplified reveal
      if (result.receivedItemIds.length > 0) {
        // Reveal items one by one
        for (let i = 0; i < result.receivedItemIds.length; i++) {
          await new Promise((r) => setTimeout(r, 600));
          setRevealIndex(i + 1);
        }
      }

      await new Promise((r) => setTimeout(r, 500));
      setPhase("done");
      onOpened();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to open lootbox");
      setPhase("idle");
    }
  }, [openLootboxMutation, lootbox.id, onOpened]);

  return (
    <Overlay>
      <Modal>
        <CloseBtn onClick={onClose}>
          <X size={24} />
        </CloseBtn>

        <Content>
          {phase === "idle" && (
            <>
              <BoxEmoji>{BOX_EMOJIS[lootbox.boxStyle] || "🎁"}</BoxEmoji>
              <Title>{lootbox.displayName}</Title>
              <Subtitle>Ready to open?</Subtitle>
              <OpenButton onClick={handleOpen}>Open Lootbox</OpenButton>
            </>
          )}

          {phase === "shaking" && (
            <ShakingBox>{BOX_EMOJIS[lootbox.boxStyle] || "🎁"}</ShakingBox>
          )}

          {phase === "opening" && (
            <OpeningBox>
              <FlashOverlay />
              <BoxEmoji>✨</BoxEmoji>
            </OpeningBox>
          )}

          {(phase === "revealing" || phase === "done") && (
            <>
              <RevealTitle>You received!</RevealTitle>
              <RevealNote>
                Check your inventory for the items you received.
              </RevealNote>
              {phase === "done" && (
                <DoneButton onClick={onClose}>Continue</DoneButton>
              )}
            </>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Modal = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  &:hover { color: white; }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const BoxEmoji = styled.div`
  font-size: 80px;
  line-height: 1;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-align: center;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
`;

const OpenButton = styled.button`
  padding: 14px 40px;
  background: linear-gradient(135deg, #9074f2 0%, #6366f1 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(144, 116, 242, 0.5);
  }
`;

const shake = keyframes`
  0%, 100% { transform: rotate(0deg) scale(1); }
  10% { transform: rotate(-8deg) scale(1.05); }
  20% { transform: rotate(8deg) scale(1.05); }
  30% { transform: rotate(-10deg) scale(1.1); }
  40% { transform: rotate(10deg) scale(1.1); }
  50% { transform: rotate(-12deg) scale(1.15); }
  60% { transform: rotate(12deg) scale(1.15); }
  70% { transform: rotate(-8deg) scale(1.1); }
  80% { transform: rotate(8deg) scale(1.1); }
  90% { transform: rotate(-4deg) scale(1.05); }
`;

const ShakingBox = styled.div`
  font-size: 100px;
  line-height: 1;
  animation: ${shake} 1.5s ease-in-out;
`;

const flash = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
`;

const OpeningBox = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FlashOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: radial-gradient(circle, rgba(144, 116, 242, 0.5) 0%, transparent 70%);
  animation: ${flash} 0.8s ease-out;
  pointer-events: none;
`;

const RevealTitle = styled.h2`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-align: center;
`;

const RevealNote = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
`;

const DoneButton = styled.button`
  padding: 12px 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;
