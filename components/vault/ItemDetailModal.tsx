import { useMutation } from "@tanstack/react-query";
import { Download, ExternalLink, Key, Sparkles, X } from "lucide-react";
import { useState } from "react";
import styled from "styled-components";
import { RARITY_COLORS, type Rarity } from "../../constants/rarity";
import { useConsumableItem } from "@/src/db/client/inventory";

interface ItemDetailModalProps {
  entry: {
    id: number;
    quantity: number;
    isUsed: boolean;
    acquiredAt: number | string | Date;
    item: {
      id: number;
      name: string;
      description: string;
      rarity: string;
      type: string;
      iconUrl?: string | null;
      previewUrl?: string | null;
      assetUrl?: string | null;
      code?: string | null;
      isConsumable: boolean;
      category?: string | null;
    };
  };
  onClose: () => void;
}

export function ItemDetailModal({ entry, onClose }: ItemDetailModalProps) {
  const useItemMutation = useMutation({
    mutationFn: (inventoryEntryId: number) => useConsumableItem(inventoryEntryId),
  });
  const [using, setUsing] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const { item } = entry;
  const rarity = item.rarity as Rarity;
  const config = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  const handleUse = async () => {
    if (!confirm("Are you sure you want to use this item? This action cannot be undone.")) return;
    setUsing(true);
    try {
      await useItemMutation.mutateAsync(entry.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to use item");
    } finally {
      setUsing(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}>
          <X size={20} />
        </CloseBtn>

        <RarityBar $gradient={config.gradient} />

        <Content>
          {item.previewUrl || item.iconUrl ? (
            <PreviewImage src={item.previewUrl || item.iconUrl!} alt={item.name} />
          ) : (
            <IconPlaceholder $color={config.color}>
              <Sparkles size={40} />
            </IconPlaceholder>
          )}

          <RarityLabel $color={config.color}>{config.label}</RarityLabel>
          <ItemName>{item.name}</ItemName>
          <ItemDescription>{item.description}</ItemDescription>

          <MetaRow>
            <MetaItem>Type: {item.type}</MetaItem>
            {item.category && <MetaItem>Category: {item.category}</MetaItem>}
            {entry.quantity > 1 && <MetaItem>Quantity: {entry.quantity}</MetaItem>}
            <MetaItem>
              Acquired: {new Date(entry.acquiredAt).toLocaleDateString()}
            </MetaItem>
          </MetaRow>

          {entry.isUsed && <UsedBanner>This item has been used</UsedBanner>}

          <Actions>
            {item.type === "download" && item.assetUrl && (
              <ActionButton onClick={() => window.open(item.assetUrl!, "_blank")}>
                <Download size={16} /> Download
              </ActionButton>
            )}

            {item.type === "code" && item.code && (
              <ActionButton onClick={() => setShowCode(!showCode)}>
                <Key size={16} /> {showCode ? "Hide Code" : "Reveal Code"}
              </ActionButton>
            )}

            {item.isConsumable && !entry.isUsed && (
              <UseButton onClick={handleUse} disabled={using}>
                {using ? "Using..." : "Use Item"}
              </UseButton>
            )}
          </Actions>

          {showCode && item.code && (
            <CodeBlock>
              <code>{item.code}</code>
            </CodeBlock>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  padding: 24px;
`;

const Modal = styled.div`
  background: ${(p) => p.theme.background};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  z-index: 1;
  &:hover { background: rgba(0, 0, 0, 0.5); }
`;

const RarityBar = styled.div<{ $gradient: string }>`
  height: 4px;
  background: ${(p) => p.$gradient};
  border-radius: 16px 16px 0 0;
`;

const Content = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const PreviewImage = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
`;

const IconPlaceholder = styled.div<{ $color: string }>`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.$color}22;
  color: ${(p) => p.$color};
`;

const RarityLabel = styled.div<{ $color: string }>`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${(p) => p.$color};
`;

const ItemName = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
  text-align: center;
`;

const ItemDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${(p) => p.theme.textColor};
  text-align: center;
  line-height: 1.5;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

const MetaItem = styled.span`
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  text-transform: capitalize;
`;

const UsedBanner = styled.div`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: ${(p) => p.theme.contrast};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.12); }
`;

const UseButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #9074f2 0%, #6366f1 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) { transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const CodeBlock = styled.div`
  width: 100%;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
  color: #22c55e;
  word-break: break-all;
  user-select: all;
`;
