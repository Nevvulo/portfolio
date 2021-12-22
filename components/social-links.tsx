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
import Socials from "../constants/socials";
import { AnimatedContainer, ContainerProps } from "./container";

const IconContainer = styled(m.a).attrs((props) => ({
  target: "_blank",
  rel: "noreferrer",
}))`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Icon = styled(FontAwesomeIcon).attrs({ size: "2x", color: "white" })`
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
  ContainerProps & { include?: ExtraSocialLinks }
> = ({ direction = "column", include = {} }) => (
  <SocialLinksContainer direction={direction}>
    <IconContainer aria-label="GitHub" target="_blank" href={Socials.GitHub}>
      <Icon icon={faGithub} />
    </IconContainer>
    <IconContainer aria-label="Twitter" target="_blank" href={Socials.Twitter}>
      <Icon icon={faTwitter} />
    </IconContainer>
    <IconContainer aria-label="Discord" target="_blank" href={Socials.Discord}>
      <Icon icon={faDiscord} size="2x" />
    </IconContainer>
    <IconContainer aria-label="E-mail" href={`mailto:${Socials.Email}`}>
      <Icon icon={faEnvelope} />
    </IconContainer>
    {include.linkedIn && (
      <IconContainer aria-label="LinkedIn" href={Socials.LinkedIn}>
        <Icon icon={faLinkedin} />
      </IconContainer>
    )}
  </SocialLinksContainer>
);
