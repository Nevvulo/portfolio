import React from "react";
import FluxColoredLogo from "../../../assets/svg/flux.svg";
import FluxBlackLogo from "../../../assets/svg/logo.svg";
import {
  AnimatedContainer,
  FadeAnimatedContainer,
} from "../../../components/container";
import { ProjectBadges } from "../../../components/project/badges";
import {
  ProjectContentContainer,
  ProjectContentHeader,
  ProjectContentSubheader,
  ProjectContentText,
  ProjectSubtitle,
} from "../../../components/project";
import Colors from "../../../constants/colors";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";

const id = "flux";
const shortDescription = "Helping 150,000 Aussies win at money";

const Logo: React.FC<{ fill?: string }> = ({ fill }) => (
  <FluxBlackLogo
    height="50px"
    style={{ fill: fill || "white", alignSelf: "flex-start" }}
  />
);

const LogoFilled: React.FC = () => (
  <FluxColoredLogo
    height="50px"
    style={{ fill: "white", alignSelf: "flex-start" }}
  />
);

export const FluxPreview: React.FC = () => (
  <>
    <AnimatedContainer layoutId={`logo-${id}`}>
      <Logo fill="white" />
    </AnimatedContainer>
    <AnimatedContainer layoutId={`description-${id}`}>
      <ProjectSubtitle color={Colors.WHITE}>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
  </>
);

const Flux: React.FC = () => (
  <>
    <AnimatedContainer layoutId={`logo-${id}`}>
      <LogoFilled />
    </AnimatedContainer>
    <AnimatedContainer layoutId={`description-${id}`}>
      <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
    </AnimatedContainer>
    <FadeAnimatedContainer direction="column" layoutId={`badges-${id}`}>
      <ProjectBadges
        technologies={[
          Technologies.REACT,
          Technologies.TYPESCRIPT,
          Technologies.SWIFT,
          Technologies.JAVA,
          Technologies.NODEJS,
        ]}
        roles={[Roles.DEVELOPER]}
      />
    </FadeAnimatedContainer>

    <ProjectContentContainer direction="column">
      <FadeAnimatedContainer direction="column" layoutId={`header-${id}-1`}>
        <ProjectContentHeader>🎯 One mission, one goal</ProjectContentHeader>
        <ProjectContentText>
          Flux exists to help young people learn about money, stay on top of
          their credit health, and get the chance to win $250,000! We help
          engage and excite people about money using gamification and modern
          design so people can make more informed decisions about their finances
          without falling asleep.
        </ProjectContentText>
      </FadeAnimatedContainer>

      <FadeAnimatedContainer direction="column" layoutId={`header-${id}-2`}>
        <ProjectContentHeader>💰 Win the Week</ProjectContentHeader>
        <ProjectContentSubheader color={Colors.FLUX_GREEN}>
          Win up to $250,000 just by saving $25
        </ProjectContentSubheader>
        <ProjectContentText>
          We've created a simple game. Save $25 and guess a 7 digit number to
          win up to $250,000. ‍Guaranteed winners every week.
        </ProjectContentText>
      </FadeAnimatedContainer>
    </ProjectContentContainer>
  </>
);

export default Flux;
