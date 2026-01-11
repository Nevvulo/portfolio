import { faDiscord, faTwitch } from "@fortawesome/free-brands-svg-icons";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, m } from "framer-motion";
import type React from "react";
import { useState } from "react";
import styled from "styled-components";
import Socials from "../../constants/socials";
import type { DiscordWidget } from "../../types/discord";
import { Button as MovingBorderButton } from "../ui/moving-border";

const BannerWrapper = styled.div`
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  max-width: 600px;
  z-index: 1000;
  height: 34px;
  min-height: 34px;

  @media (max-width: 768px) {
    top: 0.75rem;
    width: 95%;
  }
`;

const BannerContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0 1.5rem;
  text-decoration: none;
  height: 32px;
  min-height: 32px;
  max-height: 32px;
  position: relative;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const MainContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: white;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const Icon = styled(FontAwesomeIcon)`
  font-size: 1rem;
  width: 1rem;
  height: 1rem;
`;

const ExternalIcon = styled(FontAwesomeIcon)`
  font-size: 0.75rem;
  width: 0.75rem;
  height: 0.75rem;
  opacity: 0.7;
  margin-left: 0.25rem;
`;

const StatsContainer = styled(m.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding-left: 0.75rem;
  margin-left: 0.75rem;
  border-left: 1px solid rgba(88, 101, 242, 0.4);
  overflow: hidden;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const Stat = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.375rem;
`;

const StatValue = styled.div`
  color: #5865f2;
  font-weight: 600;
  font-size: 0.875rem;
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: var(--font-sans);
`;

const OnlineDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #43b581;
`;

const LivePulse = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff0000;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
`;

interface AnnouncementBannerProps {
  isLive: boolean;
  discordWidget: DiscordWidget | null;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  isLive,
  discordWidget,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const onlineCount = discordWidget?.presence_count || 0;

  if (isLive) {
    return (
      <BannerWrapper>
        <MovingBorderButton
          as="a"
          href="/live"
          borderRadius="50px"
          containerClassName="w-full !h-[34px] !min-h-[34px] !max-h-[34px]"
          className="bg-[#9146ff]/90 dark:bg-[#9146ff]/90 border-[#9146ff]/30 dark:border-[#9146ff]/30 hover:bg-[#a970ff]/95 transition-all duration-300 !p-0 !h-[32px] !min-h-[32px] !max-h-[32px]"
          style={{ height: "34px", minHeight: "34px", maxHeight: "34px" }}
          aria-label="Watch live on Twitch"
        >
          <BannerContent>
            <MainContent>
              <Icon icon={faTwitch} />
              <LivePulse />
              LIVE NOW
              <ExternalIcon icon={faExternalLinkAlt} />
            </MainContent>
          </BannerContent>
        </MovingBorderButton>
      </BannerWrapper>
    );
  }

  return (
    <BannerWrapper>
      <MovingBorderButton
        as="a"
        href={Socials.Discord}
        target="_blank"
        rel="noreferrer"
        borderRadius="50px"
        containerClassName="w-full !h-[34px] !min-h-[34px] !max-h-[34px]"
        className="bg-[#313131]/90 dark:bg-[#313131]/90 border-[#5865f2]/20 dark:border-[#5865f2]/20 hover:bg-[#3a3a3a]/95 transition-all duration-300 !p-0 !h-[32px] !min-h-[32px] !max-h-[32px]"
        style={{ height: "34px", minHeight: "34px", maxHeight: "34px" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Join us on Discord"
      >
        <BannerContent>
          <MainContent>
            <Icon icon={faDiscord} />
            Join us on Discord!
            <ExternalIcon icon={faExternalLinkAlt} />
          </MainContent>

          <AnimatePresence>
            {isHovered && discordWidget && (
              <StatsContainer
                initial={{ opacity: 0, maxWidth: 0, marginLeft: 0, paddingLeft: 0 }}
                animate={{
                  opacity: 1,
                  maxWidth: 150,
                  marginLeft: "0.75rem",
                  paddingLeft: "0.75rem",
                }}
                exit={{ opacity: 0, maxWidth: 0, marginLeft: 0, paddingLeft: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Stat>
                  <OnlineDot />
                  <StatValue>{onlineCount}</StatValue>
                  <StatLabel>Online</StatLabel>
                </Stat>
              </StatsContainer>
            )}
          </AnimatePresence>
        </BannerContent>
      </MovingBorderButton>
    </BannerWrapper>
  );
};
