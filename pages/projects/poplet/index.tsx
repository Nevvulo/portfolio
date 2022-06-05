import Image from "next/image";
import React from "react";
import styled from "styled-components";
import PopletLogo from "../../../assets/svg/projects/logo/poplet.svg";
import {
  AnimatedContainer,
  FadeAnimatedContainer,
} from "../../../components/container";
import { DetailedNavbar } from "../../../components/navbar/detailed";
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
import Colors from "../../../constants/colors";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";
import { useTheme } from "../../../hooks/useTheme";

const id = "poplet";
const title = "Poplet";
const shortDescription =
  "Note taking app with advanced features and customisability";

const LogoInverted = styled(Image).attrs({
  src: PopletLogo,
  width: "42px",
  height: "42px",
  placeholder: "blur",
})`
  filter: invert(1);
  align-self: flex-end;
  margin-right: 8px;
  margin-bottom: 4px;
  height: 42px;
  width: 42px;
`;

const Logo = styled(Image).attrs({
  src: PopletLogo,
  width: "46px",
  height: "46px",
  quality: 25,
})`
  top: -6px !important;
`;

export const PopletPreview: React.FC = () => (
  <>
    <AnimatedContainer>
      <Logo />
      <ProjectTitle>{title}</ProjectTitle>
    </AnimatedContainer>
    <AnimatedContainer>
      <ProjectSubtitle color={Colors.WHITE}>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
  </>
);

export default function Poplet() {
  const [theme] = useTheme();
  return (
    <ProjectContainer>
      <DetailedNavbar />

      <ProjectTitleContainer>
        {theme === "light" ? <LogoInverted /> : <Logo />}
        <ProjectTitle>{title}</ProjectTitle>
      </ProjectTitleContainer>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
      <FadeAnimatedContainer direction="column">
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
          <ProjectContentHeader>
            🎖 Big scope, big ambitions
          </ProjectContentHeader>
          <ProjectContentText>
            My original motivation for developing a new note-taking application
            in such a saturated market was the fact that note taking in general
            is such a manual process: it'd be nice to have information
            automatically inferred where possible to speed up your workflow so
            ultimately you and your team members can spend more time doing
            what's important.
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
            (such as server-side validation, ratelimiting, scalability) on my
            own. It was the first project I developed on my own with the
            intention of being used by lots of people so I wanted to ensure I
            got things done properly.
          </ProjectContentText>
        </FadeAnimatedContainer>
      </ProjectContentContainer>
    </ProjectContainer>
  );
}
