import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { m } from "framer-motion";
import type React from "react";
import { useState } from "react";
import styled from "styled-components";
import Socials from "../../constants/socials";
import type { DiscordWidget } from "../../types/discord";
import { Button as MovingBorderButton } from "../ui/moving-border";

const BannerWrapper = styled.div`
  margin-top: 2rem;
  width: 100%;
  max-width: 600px;

  @media (max-width: 768px) {
    margin-top: 1.5rem;
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
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 0.875rem;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const DiscordIcon = styled(FontAwesomeIcon)`
  font-size: 1rem;
`;

const ExternalIcon = styled(FontAwesomeIcon)`
  font-size: 0.75rem;
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
  font-family: "Inter", sans-serif;
  display: flex;
  align-items: center;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: "Inter", sans-serif;
`;

const OnlineDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #43b581;
`;

interface DiscordBannerProps {
  widget: DiscordWidget | null;
}

export const DiscordBanner: React.FC<DiscordBannerProps> = ({ widget }) => {
  const [isHovered, setIsHovered] = useState(false);

  const onlineCount = widget?.presence_count || 0;

  return (
    <BannerWrapper>
      <MovingBorderButton
        as="a"
        href={Socials.Discord}
        target="_blank"
        rel="noreferrer"
        borderRadius="0.5rem"
        containerClassName="w-full !h-[34px] !min-h-[34px] !max-h-[34px]"
        className="dark:bg-[#000000]/100 border-[#5865f2]/20 dark:border-[#5865f2]/20 hover:bg-[#3a3a3a]/20 transition-all duration-300 !p-0 !h-[32px] !min-h-[32px] !max-h-[32px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Join us on Discord"
      >
        <BannerContent>
          <MainContent>
            <DiscordIcon icon={faDiscord} />
            Join us on Discord!
            <ExternalIcon icon={faExternalLinkAlt} />
          </MainContent>

          {widget && (
            <StatsContainer
              initial={false}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Stat>
                <OnlineDot />
                <StatValue>{onlineCount}</StatValue>
                <StatLabel>Online</StatLabel>
              </Stat>
            </StatsContainer>
          )}
        </BannerContent>
      </MovingBorderButton>
    </BannerWrapper>
  );
};
