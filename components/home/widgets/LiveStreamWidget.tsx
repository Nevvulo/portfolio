import { Radio, Users } from "lucide-react";
import Image from "next/image";
import styled, { keyframes } from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/theme";
import { WidgetContainer } from "./WidgetContainer";

interface LiveStreamWidgetProps {
  viewerCount?: number;
  thumbnailUrl?: string;
  streamTitle?: string;
}

export function LiveStreamWidget({
  viewerCount,
  thumbnailUrl,
  streamTitle = "Nevulo is live!",
}: LiveStreamWidgetProps) {
  const defaultThumbnail = "https://static-cdn.jtvnw.net/previews-ttv/live_user_nevulo-440x248.jpg";

  return (
    <WidgetContainer variant="live" fullWidth noPadding>
      <StreamLink href="https://twitch.tv/nevulo" target="_blank" rel="noopener noreferrer">
        <ThumbnailContainer>
          <Image
            src={thumbnailUrl || defaultThumbnail}
            alt="Live stream preview"
            fill
            style={{ objectFit: "cover" }}
            unoptimized
          />
          <LiveBadge>
            <PulsingDot />
            <span>LIVE</span>
          </LiveBadge>
          {viewerCount !== undefined && (
            <ViewerCount>
              <Users size={12} />
              <span>{viewerCount.toLocaleString()}</span>
            </ViewerCount>
          )}
          <GradientOverlay />
        </ThumbnailContainer>
        <ContentArea>
          <StreamInfo>
            <StreamTitle>{streamTitle}</StreamTitle>
            <StreamSubtitle>Nevulo is streaming now on Twitch</StreamSubtitle>
          </StreamInfo>
          <WatchButton>
            <Radio size={16} />
            <span>Watch Now</span>
          </WatchButton>
        </ContentArea>
      </StreamLink>
    </WidgetContainer>
  );
}

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
`;

const StreamLink = styled.a`
  display: block;
  text-decoration: none;
  color: inherit;
`;

const ThumbnailContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 6;
  min-height: 140px;

  @media (max-width: 768px) {
    aspect-ratio: 16 / 9;
  }
`;

const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 40%,
    rgba(0, 0, 0, 0.7) 100%
  );
`;

const LiveBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #ef4444;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 2;
`;

const PulsingDot = styled.div`
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const ViewerCount = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  z-index: 2;
`;

const ContentArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const StreamInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StreamTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
`;

const StreamSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const WatchButton = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: ${LOUNGE_COLORS.tier1}dd;
    transform: scale(1.02);
  }

  @media (max-width: 600px) {
    justify-content: center;
  }
`;
