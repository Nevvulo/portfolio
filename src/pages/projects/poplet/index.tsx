import React from "react";
import styled from "styled-components";
import PopletLogo from "../../../assets/svg/poplet.svg";
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
} from "../../../components/project";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";

const id = "poplet";
const title = "Poplet";
const shortDescription =
  "Note taking app with advanced features and customisability";

const Logo = styled(PopletLogo)`
  align-self: flex-end;
  margin-right: 8px;
  margin-bottom: 4px;
  height: 42px;
  width: 42px;
`;

export const PopletPreview: React.FC = () => (
  <>
    <AnimatedContainer layoutId={`logo-${id}`}>
      <Logo />
      <ProjectTitle>{title}</ProjectTitle>
    </AnimatedContainer>
    <AnimatedContainer layoutId={`description-${id}`}>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
  </>
);

const Poplet: React.FC = () => (
  <>
    <AnimatedContainer layoutId={`logo-${id}`}>
      <Logo />
      <ProjectTitle>{title}</ProjectTitle>
    </AnimatedContainer>
    <AnimatedContainer layoutId={`description-${id}`}>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
    <FadeAnimatedContainer direction="column" layoutId={`badges-${id}`}>
      <ProjectBadges
        technologies={[
          Technologies.REACT,
          Technologies.JAVASCRIPT,
          Technologies.NODEJS,
          Technologies.CSS,
          Technologies.PYTHON,
        ]}
        roles={[Roles.PAST_LEAD_DEVELOPER]}
      />
    </FadeAnimatedContainer>

    <ProjectContentContainer direction="column">
      <FadeAnimatedContainer direction="column" layoutId={`header-${id}-1`}>
        <ProjectContentHeader>📝 Thinking rethought</ProjectContentHeader>
        <ProjectContentText>
          Poplet was a note-taking application with rich features such as
          real-time collaboration, permissions, automated actions when certain
          events take place and so much more.
        </ProjectContentText>
      </FadeAnimatedContainer>

      <FadeAnimatedContainer direction="column" layoutId={`header-${id}-2`}>
        <ProjectContentHeader>🎖 Big scope, big ambitions</ProjectContentHeader>
        <ProjectContentText>
          My original motivation for developing a new note-taking application in
          such a saturated market was the fact that note taking in general is
          such a manual process: it'd be nice to have information automatically
          inferred where possible to speed up your workflow so ultimately you
          and your team members can spend more time doing what's important.
        </ProjectContentText>
      </FadeAnimatedContainer>

      <FadeAnimatedContainer direction="column" layoutId={`header-${id}-3`}>
        <ProjectContentHeader>
          🧠 A great learning experience
        </ProjectContentHeader>

        <ProjectContentText>
          Although Poplet was eventually discontinued, it still served as a
          great learning experience for me and gave me lots of knowledge about
          how to deal with translations, dealing with a large-scale React
          project and security as I implemented a lot of core functionality
          (such as server-side validation, ratelimiting, scalability) on my own.
          It was the first project I developed on my own with the intention of
          being used by lots of people so I wanted to ensure I got things done
          properly.
        </ProjectContentText>
      </FadeAnimatedContainer>
    </ProjectContentContainer>
  </>
);

export default Poplet;
