import Image from "next/image";
import React from "react";
import PowercordLogo from "../../../assets/svg/projects/logo/powercord.svg";
import {
  AnimatedContainer,
  FadeAnimatedContainer,
} from "../../../components/container";
import { DetailedNavbar } from "../../../components/navbar/detailed";
import {
  ProjectBadges,
  ProjectContainer,
  ProjectContentContainer,
  ProjectContentText,
  ProjectSubtitle,
  ProjectTitle,
  ProjectTitleContainer,
} from "../../../components/project";
import Colors from "../../../constants/colors";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";

const id = "powercord";
const title = "Powercord";
const shortDescription = "Client modification for the Discord desktop client";

export const PowercordPreview: React.FC = () => (
  <>
    <AnimatedContainer>
      <div style={{ paddingRight: "0.5em" }}>
        <Image quality={25} src={PowercordLogo} height="38" width="38" />
      </div>

      <ProjectTitle>{title}</ProjectTitle>
    </AnimatedContainer>
    <AnimatedContainer>
      <ProjectSubtitle color={Colors.WHITE}>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
  </>
);

export default function Powercord() {
  return (
    <ProjectContainer>
      <DetailedNavbar />

      <ProjectTitleContainer>
        <Image quality={25} src={PowercordLogo} height="46" width="46" />
        <ProjectTitle>{title}</ProjectTitle>
      </ProjectTitleContainer>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
      <FadeAnimatedContainer direction="column">
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
        <FadeAnimatedContainer direction="column">
          <ProjectContentText>
            A client modification made for Discord. I have helped write code for
            the client injector, as well as multiple plugins that range
            extensively in skill sets, such as audio visualizers with Electron
            API's, use of React components, and other plugins as well.
          </ProjectContentText>
        </FadeAnimatedContainer>
      </ProjectContentContainer>
    </ProjectContainer>
  );
}
