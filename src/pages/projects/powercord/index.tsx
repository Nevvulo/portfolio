import React from "react";
import PowercordLogo from "../../../assets/svg/powercord.svg";
import {
  AnimatedContainer,
  FadeAnimatedContainer,
} from "../../../components/container";
import {
  ProjectBadges,
  ProjectContentContainer,
  ProjectContentText,
  ProjectSubtitle,
  ProjectTitle,
} from "../../../components/project";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";

const id = "powercord";
const title = "Powercord";
const shortDescription = "Client modification for the Discord desktop client";

const PowercordLogoMate: React.FC<{ fill?: string }> = ({ fill }) => (
  <PowercordLogo
    height="46px"
    style={{
      fill: fill || "white",
      alignSelf: "flex-start",
      marginTop: "4px",
      marginRight: "4px",
    }}
  />
);

export const PowercordPreview: React.FC = () => (
  <>
    <AnimatedContainer layoutId={`logo-${id}`}>
      <PowercordLogoMate />
      <ProjectTitle>{title}</ProjectTitle>
    </AnimatedContainer>
    <AnimatedContainer layoutId={`description-${id}`}>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
  </>
);

const Powercord: React.FC = () => (
  <>
    <AnimatedContainer layoutId={`logo-${id}`}>
      <PowercordLogoMate />
      <ProjectTitle>{title}</ProjectTitle>
    </AnimatedContainer>
    <AnimatedContainer layoutId={`description-${id}`}>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
    <FadeAnimatedContainer direction="column" layoutId={`badges-${id}`}>
      <ProjectBadges
        technologies={[
          Technologies.NODEJS,
          Technologies.JAVASCRIPT,
          Technologies.REACT,
          Technologies.CSS,
        ]}
        roles={[Roles.CONTRIBUTOR, Roles.PLUGIN_DEVELOPER]}
      />
    </FadeAnimatedContainer>

    <ProjectContentContainer direction="column">
      <FadeAnimatedContainer direction="column" layoutId={`header-${id}-1`}>
        <ProjectContentText>
          A client modification made for Discord. I have helped write code for
          the client injector, as well as multiple plugins that range
          extensively in skill sets, such as audio visualizers with Electron
          API's, use of React components, and other plugins as well.
        </ProjectContentText>
      </FadeAnimatedContainer>
    </ProjectContentContainer>
  </>
);

export default Powercord;
