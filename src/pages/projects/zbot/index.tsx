import React from "react";
import styled from "styled-components";
import zBotLogo from "url:../../../assets/img/zbot.png?as=webp";
import {
  AnimatedContainer,
  FadeAnimatedContainer,
} from "../../../components/container";
import {
  ProjectBadges,
  ProjectContentContainer,
  ProjectContentHeader,
  ProjectContentText,
  ProjectSubtitle,
  ProjectTitle,
  ProjectTitleContainer,
} from "../../../components/project";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";

const id = "zbot";
const title = "zBot";
const shortDescription =
  "Multi-purpose Discord bot featuring a community-driven economy";

const Logo = styled.img`
  align-self: center;
  margin-top: 4px;
  margin-right: 8px;
  height: 36px;
  width: 36px;
  border-radius: 12px;
  align-items: center;
`;

export const zBotPreview: React.FC = () => (
  <>
    <AnimatedContainer layoutId={`logo-${id}`}>
      <Logo src={zBotLogo} />
      <ProjectTitle>{title}</ProjectTitle>
    </AnimatedContainer>
    <AnimatedContainer layoutId={`description-${id}`}>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
  </>
);

const zBot: React.FC = () => (
  <>
    <ProjectTitleContainer layoutId={`logo-${id}`}>
      <Logo src={zBotLogo} />
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
          zBot was a multi-purpose Discord bot application that allowed users to
          use commands to make their experience on their Discord server more
          enjoyable and interactive. It provided moderation commands to punish
          people for breaking rules, a feature rich text-based economy system
          with customisable features, image generation, music, gamification
          through chat messages - zBot had it all.
        </ProjectContentText>
      </FadeAnimatedContainer>

      <FadeAnimatedContainer direction="column" layoutId={`header-${id}-2`}>
        <ProjectContentHeader>
          🙋🏻 60 thousand users over 1,500 guilds
        </ProjectContentHeader>
        <ProjectContentText>
          zBot is the largest self-made project I've worked on, both in terms of
          userbase and complexity. The application was "installed" on over 1,500
          separate Discord servers at its peak, totalling over 60 thousand
          aggregate users daily.
          <br />
          <br />
          zBot had over 100 unique commands and over 200 source files handling
          events, external services, custom logic and advanced customisation so
          server owners could build their own configuration.
        </ProjectContentText>
      </FadeAnimatedContainer>
    </ProjectContentContainer>
  </>
);

export default zBot;
