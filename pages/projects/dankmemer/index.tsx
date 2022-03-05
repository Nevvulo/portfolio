import Image from "next/image";
import React from "react";
import styled from "styled-components";
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
import DankMemerLogo from "./../../../assets/img/projects/logo/dank-memer.png";

const id = "dankmemer";
const title = "Dank Memer";
const shortDescription =
  "Multi-purpose Discord bot featuring a community-driven economy";

const Logo = styled(Image).attrs({
  src: DankMemerLogo,
  width: "52",
  objectFit: "scale-down",
  height: "32",
  quality: 25,
})`
  align-items: center;
`;

export const DankMemerPreview: React.FC = () => (
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

export default function DankMemer() {
  return (
    <ProjectContainer>
      <DetailedNavbar />

      <ProjectTitleContainer>
        <Logo />
        <ProjectTitle>{title}</ProjectTitle>
      </ProjectTitleContainer>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
      <FadeAnimatedContainer direction="column" layoutId={`badges-${id}`}>
        <ProjectBadges
          technologies={[
            Technologies.JAVASCRIPT,
            Technologies.RETHINKDB,
            Technologies.REDIS,
            Technologies.PYTHON,
            Technologies.NODEJS,
            Technologies.REACT,
            Technologies.CSS,
          ]}
          roles={[Roles.PAST_DEVELOPER]}
        />
      </FadeAnimatedContainer>

      <ProjectContentContainer direction="column">
        <FadeAnimatedContainer direction="column">
          <ProjectContentHeader>
            🏃‍♂️ Your average economy with a spin
          </ProjectContentHeader>
          <ProjectContentText>
            During my time working on the project, I was largely responsible for
            the currency system which allows users to build up a virtual
            currency that can be used to buy in-game items. This included the
            ability to work at a job throughout the real world day, buying
            commodities from a shop, stealing coins from other users and a slot
            machine - all achieved with just text.
          </ProjectContentText>
        </FadeAnimatedContainer>

        <FadeAnimatedContainer direction="column" layoutId={`header-${id}-2`}>
          <ProjectContentHeader>👑 Over 2 million servers</ProjectContentHeader>
          <ProjectContentText>
            Dank Memer is the largest project I've worked on, amassing over 2
            million servers during my time working on the project which roughly
            equates to 1 million daily users. I learned a lot about working with
            and deploying changes to production systems, as well as optimizing
            software to be efficient at scale.
          </ProjectContentText>
        </FadeAnimatedContainer>
      </ProjectContentContainer>
    </ProjectContainer>
  );
}
