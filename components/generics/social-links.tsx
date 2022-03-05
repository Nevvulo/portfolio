import {
  faDiscord,
  faGithub,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { m } from "framer-motion";
import React from "react";
import styled from "styled-components";
import Socials from "../../constants/socials";
import { AnimatedContainer, ContainerProps } from "../container";

const IconContainer = styled(m.a).attrs((props) => ({
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
  width: 5vw !important;
  height: 5vh !important;
`;

const SocialLinksContainer = styled(AnimatedContainer)`
  padding-left: 32px;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: revert;
    padding: 0;
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
