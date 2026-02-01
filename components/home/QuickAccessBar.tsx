import { useQuery } from "convex/react";
import { Boxes, Compass, Download, Lock, MessageCircle, Newspaper, Settings } from "lucide-react";
import Link from "next/link";
import styled from "styled-components";
import { api } from "../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../constants/theme";

export function QuickAccessBar() {
  const user = useQuery(api.users.getMe);
  const hasTier1Access = user?.tier === "tier1" || user?.tier === "tier2";

  return (
    <Wrapper>
      <ScrollContainer>
        <ShortcutLink href="https://lounge.nev.so" target="_blank" rel="noopener noreferrer">
          <ShortcutCard $color="#5865f2">
            <IconCircle $color="#5865f2">
              <MessageCircle size={15} />
            </IconCircle>
            <ShortcutInfo>
              <ShortcutLabel>Lounge</ShortcutLabel>
              <ShortcutDesc>Fediverse community</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        <ShortcutLink href="/learn">
          <ShortcutCard $color="#22c55e">
            <IconCircle $color="#22c55e">
              <Compass size={15} />
            </IconCircle>
            <ShortcutInfo>
              <ShortcutLabel>Explore</ShortcutLabel>
              <ShortcutDesc>Browse all content</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        <ShortcutLink href="/software">
          <ShortcutCard $color="#3b82f6">
            <IconCircle $color="#3b82f6">
              <Boxes size={15} />
            </IconCircle>
            <ShortcutInfo>
              <ShortcutLabel>Software</ShortcutLabel>
              <ShortcutDesc>Apps & games</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        <ShortcutLink href="/learn?filter=news">
          <ShortcutCard $color="#f59e0b">
            <IconCircle $color="#f59e0b">
              <Newspaper size={15} />
            </IconCircle>
            <ShortcutInfo>
              <ShortcutLabel>News</ShortcutLabel>
              <ShortcutDesc>Latest updates</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        <ShortcutLink href="/account">
          <ShortcutCard $color={LOUNGE_COLORS.tier1}>
            <IconCircle $color={LOUNGE_COLORS.tier1}>
              <Settings size={15} />
            </IconCircle>
            <ShortcutInfo>
              <ShortcutLabel>Account</ShortcutLabel>
              <ShortcutDesc>Settings & profile</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        {hasTier1Access ? (
          <ShortcutLink href="/vault">
            <ShortcutCard $color="#f7be5c">
              <IconCircle $color="#f7be5c">
                <Download size={15} />
              </IconCircle>
              <ShortcutInfo>
                <ShortcutLabel>Vault</ShortcutLabel>
                <ShortcutDesc>Downloads & assets</ShortcutDesc>
              </ShortcutInfo>
            </ShortcutCard>
          </ShortcutLink>
        ) : (
          <ShortcutLink href="/support">
            <ShortcutCard $color="#6b7280" $locked>
              <IconCircle $color="#6b7280" $locked>
                <Lock size={15} />
              </IconCircle>
              <ShortcutInfo>
                <ShortcutLabel $locked>Vault</ShortcutLabel>
                <ShortcutDesc $locked>Super Legend only</ShortcutDesc>
              </ShortcutInfo>
            </ShortcutCard>
          </ShortcutLink>
        )}
      </ScrollContainer>
      <FadeEdge />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  overflow: hidden;
`;

const FadeEdge = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 48px;
  background: linear-gradient(
    to right,
    transparent,
    ${(props) => props.theme.background}
  );
  pointer-events: none;
  z-index: 1;
`;

const ScrollContainer = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-right: 40px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ShortcutLink = styled(Link)`
  text-decoration: none;
  scroll-snap-align: start;
  flex-shrink: 0;
`;

const ShortcutCard = styled.div<{ $color: string; $locked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;
  opacity: ${(props) => (props.$locked ? 0.6 : 1)};
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: ${(props) => (props.$locked ? "rgba(255, 255, 255, 0.08)" : `${props.$color}30`)};
    transform: translateY(-1px);
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    gap: 8px;
  }
`;

const IconCircle = styled.div<{ $color: string; $locked?: boolean }>`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.$locked ? "rgba(107, 114, 128, 0.1)" : `${props.$color}10`)};
  border-radius: 8px;
  color: ${(props) => (props.$locked ? "rgba(255, 255, 255, 0.3)" : `${props.$color}99`)};
  flex-shrink: 0;

  svg {
    width: 15px;
    height: 15px;
  }

  ${ShortcutCard}:hover & {
    background: ${(props) => (props.$locked ? "rgba(107, 114, 128, 0.15)" : `${props.$color}18`)};
  }
`;

const ShortcutInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const ShortcutLabel = styled.span<{ $locked?: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => (props.$locked ? "rgba(255, 255, 255, 0.4)" : props.theme.contrast)};
`;

const ShortcutDesc = styled.span<{ $locked?: boolean }>`
  font-size: 11px;
  color: ${(props) => (props.$locked ? "rgba(255, 255, 255, 0.25)" : props.theme.textColor)};
  opacity: ${(props) => (props.$locked ? 1 : 0.45)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
