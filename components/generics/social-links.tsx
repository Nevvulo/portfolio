import {
  faGithub,
  faLinkedin,
  faMastodon,
  faReddit,
  faTiktok,
  faTwitch,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { m } from "framer-motion";
import type React from "react";
import styled from "styled-components";
import Socials from "../../constants/socials";
import { AnimatedContainer, type ContainerProps } from "../container";

const IconContainer = styled(m.a).attrs(() => ({
  target: "_blank",
  rel: "me noreferrer",
}))`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Icon = styled(FontAwesomeIcon).attrs((props) => ({
  size: "2x",
  color: props.color || props.theme.contrast,
}))`
  margin: 0.45em;
  width: min(7.5vw, 38px) !important;
  height: min(7.5vh, 38px) !important;
`;

const SocialLinksContainer = styled(AnimatedContainer)`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  padding: 0;
  margin-top: 1rem;

  /* Remove left margin on first icon */
  & > a:first-child svg {
    margin-left: 0;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: row;
    padding: 0;
    justify-content: center;
    width: 100%;
    margin-top: 1em;
  }
`;

interface ExtraSocialLinks {
  linkedIn?: boolean;
  email?: boolean;
  tiktok?: boolean;
  mastodon?: boolean;
}

export const SocialLinks: React.FC<
  ContainerProps & { include?: ExtraSocialLinks } & {
    color?: string;
    hideTwitch?: boolean;
    onHoverChange?: (isHovered: boolean) => void;
  }
> = ({ direction = "column", include = {}, color, hideTwitch = false, onHoverChange }) => {
  const handleHover = (isHovered: boolean, platform: string) => {
    // Don't trigger the extra "v" animation for Reddit
    if (platform === "reddit") {
      return;
    }
    onHoverChange?.(isHovered);
  };

  return (
    <SocialLinksContainer direction={direction}>
      {!hideTwitch && (
        <IconContainer
          aria-label="Twitch"
          target="_blank"
          href={Socials.Twitch}
          onMouseEnter={() => handleHover(true, "twitch")}
          onMouseLeave={() => handleHover(false, "twitch")}
        >
          <Icon color={color} icon={faTwitch} />
        </IconContainer>
      )}
      <IconContainer
        aria-label="YouTube"
        target="_blank"
        href={Socials.YouTube}
        onMouseEnter={() => handleHover(true, "youtube")}
        onMouseLeave={() => handleHover(false, "youtube")}
      >
        <Icon color={color} icon={faYoutube} />
      </IconContainer>
      {include.tiktok && (
        <IconContainer
          aria-label="TikTok"
          target="_blank"
          href={Socials.TikTok}
          onMouseEnter={() => handleHover(true, "tiktok")}
          onMouseLeave={() => handleHover(false, "tiktok")}
        >
          <Icon color={color} icon={faTiktok} />
        </IconContainer>
      )}
      <IconContainer
        aria-label="Reddit"
        target="_blank"
        href={Socials.Reddit}
        onMouseEnter={() => handleHover(true, "reddit")}
        onMouseLeave={() => handleHover(false, "reddit")}
      >
        <Icon color={color} icon={faReddit} />
      </IconContainer>
      <IconContainer
        aria-label="GitHub"
        target="_blank"
        href={Socials.GitHub}
        onMouseEnter={() => handleHover(true, "github")}
        onMouseLeave={() => handleHover(false, "github")}
      >
        <Icon color={color} icon={faGithub} />
      </IconContainer>
      {include.email && (
        <IconContainer
          aria-label="E-mail"
          href={`mailto:${Socials.Email}`}
          onMouseEnter={() => handleHover(true, "email")}
          onMouseLeave={() => handleHover(false, "email")}
        >
          <Icon color={color} icon={faEnvelope} />
        </IconContainer>
      )}
      {include.linkedIn && (
        <IconContainer
          aria-label="LinkedIn"
          href={Socials.LinkedIn}
          onMouseEnter={() => handleHover(true, "linkedin")}
          onMouseLeave={() => handleHover(false, "linkedin")}
        >
          <Icon color={color} icon={faLinkedin} />
        </IconContainer>
      )}
      {include.mastodon && (
        <IconContainer
          aria-label="Mastodon"
          href={Socials.Mastodon}
          onMouseEnter={() => handleHover(true, "mastodon")}
          onMouseLeave={() => handleHover(false, "mastodon")}
        >
          <Icon color={color} icon={faMastodon} />
        </IconContainer>
      )}
    </SocialLinksContainer>
  );
};
