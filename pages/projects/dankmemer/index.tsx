import React from "react";
import styled from "styled-components";
import Image from "next/image";
import DankMemerLogo from "./../../../assets/img/dank-memer.png";
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
} from "../../../components/project";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";
import { Navbar } from "../../../components/navbar";
import { ROUTES } from "../../../constants/routes";

const id = "dankmemer";
const title = "Dank Memer";
const shortDescription =
  "Multi-purpose Discord bot featuring a community-driven economy";

const Logo = styled.img.attrs({ src: DankMemerLogo.src })`
  align-self: flex-end;
  margin-right: 8px;
  height: 36px;
  position: relative;
  top: -6px;
  width: 36px;
  border-radius: 12px;
  align-items: center;
`;

export const DankMemerPreview: React.FC = () => (
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

export default function DankMemer() {
  return (
    <ProjectContainer>
      <Navbar title={title} route={ROUTES.PROJECTS.ROOT} />
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
        <FadeAnimatedContainer direction="column" layoutId={`header-${id}-1`}>
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
