import { faDiscord, faGithub, faLinkedin, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { m } from "framer-motion";
import type React from "react";
import styled from "styled-components";
import Socials from "../../constants/socials";
import { AnimatedContainer, type ContainerProps } from "../container";

const IconContainer = styled(m.a).attrs(() => ({
  target: "_blank",
  rel: "noreferrer",
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
  padding-left: 32px;
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
  linkedIn: boolean;
}

export const SocialLinks: React.FC<
  ContainerProps & { include?: ExtraSocialLinks } & { color?: string }
> = ({ direction = "column", include = {}, color }) => (
  <SocialLinksContainer direction={direction}>
    <IconContainer aria-label="GitHub" target="_blank" href={Socials.GitHub}>
      <Icon color={color} icon={faGithub} />
    </IconContainer>
    <IconContainer aria-label="Twitter" target="_blank" href={Socials.Twitter}>
      <Icon color={color} icon={faTwitter} />
    </IconContainer>
    <IconContainer aria-label="Discord" target="_blank" href={Socials.Discord}>
      <Icon color={color} icon={faDiscord} size="2x" />
    </IconContainer>
    <IconContainer aria-label="E-mail" href={`mailto:${Socials.Email}`}>
      <Icon color={color} icon={faEnvelope} />
    </IconContainer>
    {include.linkedIn && (
      <IconContainer aria-label="LinkedIn" href={Socials.LinkedIn}>
        <Icon color={color} icon={faLinkedin} />
      </IconContainer>
    )}
  </SocialLinksContainer>
);
