import { useQuery } from "convex/react";
import { Boxes, Compass, Download, Newspaper, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import { api } from "../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../constants/theme";
import loungeIcon from "../../assets/img/lounge.png";

export function QuickAccessBar() {
  const user = useQuery(api.users.getMe);
  const hasTier1Access = user?.tier === "tier1" || user?.tier === "tier2";

  return (
    <Wrapper>
      <ScrollContainer>
        <ShortcutLink href="https://lounge.nev.so" target="_blank" rel="noopener noreferrer">
          <ShortcutCard>
            <Image src={loungeIcon} alt="Lounge" width={18} height={18} style={{ flexShrink: 0 }} />
            <ShortcutInfo>
              <LoungeLabel>nevulounge</LoungeLabel>
              <ShortcutDesc>Fediverse community</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        <ShortcutLink href="/learn">
          <ShortcutCard>
            <Compass size={18} />
            <ShortcutInfo>
              <ExploreLabel>explore</ExploreLabel>
              <ShortcutDesc>Browse all content</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        <ShortcutLink href="/software">
          <ShortcutCard>
            <Boxes size={18} />
            <ShortcutInfo>
              <ShortcutLabel>Software</ShortcutLabel>
              <ShortcutDesc>Apps & games</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        <ShortcutLink href="/learn?filter=news">
          <ShortcutCard>
            <Newspaper size={18} />
            <ShortcutInfo>
              <ShortcutLabel>News</ShortcutLabel>
              <ShortcutDesc>Latest updates</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        <ShortcutLink href="/account">
          <ShortcutCard>
            <UserCircle size={18} />
            <ShortcutInfo>
              <ShortcutLabel>Account</ShortcutLabel>
              <ShortcutDesc>Settings & profile</ShortcutDesc>
            </ShortcutInfo>
          </ShortcutCard>
        </ShortcutLink>

        {hasTier1Access && (
          <ShortcutLink href="/vault">
            <ShortcutCard>
              <Download size={18} />
              <ShortcutInfo>
                <ExploreLabel>vault</ExploreLabel>
                <ShortcutDesc>Downloads & assets</ShortcutDesc>
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
  display: none;

  @media (max-width: 800px) {
    display: block;
  }
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

const ShortcutCard = styled.div<{ $locked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;
  opacity: ${(props) => (props.$locked ? 0.5 : 1)};
  white-space: nowrap;
  color: white;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    opacity: 0.85;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(144, 116, 242, 0.2);
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    gap: 8px;
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
  line-height: 1;
  color: ${(props) => (props.$locked ? "rgba(255, 255, 255, 0.4)" : props.theme.contrast)};
`;

const LoungeLabel = styled.span`
  font-size: 12px;
  font-family: "Sixtyfour", var(--font-mono);
  color: ${(props) => props.theme.contrast};
  line-height: 1;
`;

const ExploreLabel = styled.span`
  font-size: 15px;
  font-family: "Protest Revolution", sans-serif;
  letter-spacing: 1.5px;
  line-height: 1;
  color: ${(props) => props.theme.contrast};
`;

const ShortcutDesc = styled.span<{ $locked?: boolean }>`
  font-size: 11px;
  color: ${(props) => (props.$locked ? "rgba(255, 255, 255, 0.25)" : props.theme.textColor)};
  opacity: ${(props) => (props.$locked ? 1 : 0.45)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
