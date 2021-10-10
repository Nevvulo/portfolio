import React from "react";
import Image from "next/image";
import styled from "styled-components";
import zBotLogo from "./../../../assets/img/zbot.png";
import {
  AnimatedContainer,
  FadeAnimatedContainer,
} from "../../../components/container";
import {
  ProjectBadges,
  ProjectContainer,
  ProjectContentContainer,
  ProjectContentHeader,
  ProjectContentText,
  ProjectSubtitle,
  ProjectTitle,
  ProjectTitleContainer,
} from "../../../components/project";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";
import { Navbar } from "../../../components/navbar";
import { ROUTES } from "../../../constants/routes";

const id = "zbot";
const title = "zBot";
const shortDescription =
  "Multi-purpose Discord bot featuring a community-driven economy";

const Logo = styled.img.attrs({
  src: zBotLogo.src,
  height: "36",
  width: "36",
  layout: "fixed",
})`
  position: relative !important;
  top: 8px !important;
  height: 36px !important;
  width: 36px !important;
  border-radius: 4px;
`;

export const zBotPreview: React.FC = () => (
  <>
    <AnimatedContainer layoutId={`logo-${id}`}>
      <Logo />
      <ProjectTitle aria-expanded="false">{title}</ProjectTitle>
    </AnimatedContainer>
    <AnimatedContainer layoutId={`description-${id}`}>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
  </>
);

export default function zBot() {
  return (
    <ProjectContainer>
      <Navbar title={title} route={ROUTES.PROJECTS.ROOT} />
      <ProjectTitleContainer layoutId={`logo-${id}`}>
        <Logo />
        <ProjectTitle>{title}</ProjectTitle>
      </ProjectTitleContainer>
      <AnimatedContainer layoutId={`description-${id}`}>
        <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
      </AnimatedContainer>
      <FadeAnimatedContainer direction="column" layoutId={`badges-${id}`}>
        <ProjectBadges
          technologies={[
            Technologies.JAVASCRIPT,
            Technologies.NODEJS,
            Technologies.HTML,
            Technologies.CSS,
          ]}
          roles={[Roles.PAST_LEAD_DEVELOPER]}
        />
      </FadeAnimatedContainer>

      <ProjectContentContainer direction="column">
        <FadeAnimatedContainer direction="column" layoutId={`header-${id}-1`}>
          <ProjectContentHeader>
            💡 Everything you need in one place
          </ProjectContentHeader>
          <ProjectContentText>
            zBot was a multi-purpose Discord bot application that allowed users
            to use commands to make their experience on their Discord server
            more enjoyable and interactive. It provided moderation commands to
            punish people for breaking rules, a feature rich text-based economy
            system with customisable features, image generation, music,
            gamification through chat messages - zBot had it all.
          </ProjectContentText>
        </FadeAnimatedContainer>

        <FadeAnimatedContainer direction="column" layoutId={`header-${id}-2`}>
          <ProjectContentHeader>
            🙋🏻 60 thousand users over 1,500 guilds
          </ProjectContentHeader>
          <ProjectContentText>
            zBot is the largest self-made project I've worked on, both in terms
            of userbase and complexity. The application was "installed" on over
            1,500 separate Discord servers at its peak, totalling over 60
            thousand aggregate users daily.
            <br />
            <br />
            zBot had over 100 unique commands and over 200 source files handling
            events, external services, custom logic and advanced customisation
            so server owners could build their own configuration.
          </ProjectContentText>
        </FadeAnimatedContainer>
      </ProjectContentContainer>
    </ProjectContainer>
  );
}
