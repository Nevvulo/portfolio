import {
  faDiscord,
  faGithub,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";
import Socials from "../constants/socials";
import { AnimatedContainer, ContainerProps } from "./container";

const IconContainer = styled(motion.a).attrs({ target: "_blank" })`
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
    <IconContainer target="_blank" href={Socials.GitHub}>
      <Icon icon={faGithub} />
    </IconContainer>
    <IconContainer target="_blank" href={Socials.Twitter}>
      <Icon icon={faTwitter} />
    </IconContainer>
    <IconContainer target="_blank" href={Socials.Discord}>
      <Icon icon={faDiscord} size="2x" />
    </IconContainer>
    <IconContainer href={`mailto:${Socials.Email}`}>
      <Icon icon={faEnvelope} />
    </IconContainer>
    {include.linkedIn && (
      <IconContainer href={Socials.LinkedIn}>
        <Icon icon={faLinkedin} />
      </IconContainer>
    )}
  </SocialLinksContainer>
);
