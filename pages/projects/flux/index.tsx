import Image from "next/image";
import React from "react";
import styled from "styled-components";
import FluxBlackLogo from "../../../assets/svg/projects/logo/flux-dark.svg";
import FluxWhiteLogo from "../../../assets/svg/projects/logo/flux-white.svg";
import FluxColoredLogo from "../../../assets/svg/projects/logo/flux.svg";
import {
  AnimatedContainer,
  FadeAnimatedContainer,
} from "../../../components/container";
import { DetailedNavbar } from "../../../components/navbar/detailed";
import {
  ProjectContainer,
  ProjectContentContainer,
  ProjectContentHeader,
  ProjectContentSubheader,
  ProjectContentText,
  ProjectSubtitle,
  ProjectTitleContainer,
} from "../../../components/project";
import { ProjectBadges } from "../../../components/project/badges";
import Colors from "../../../constants/colors";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";
import { useTheme } from "../../../hooks/useTheme";

const id = "flux";
const shortDescription = "Helping 200,000 Aussies win at money";


export const FluxPreview: React.FC = () => {
  return (
    <>
      <AnimatedContainer style={{ marginBottom: '-3em' }}>
        <Image
          src={FluxWhiteLogo}
          height={180}
          width={180}
          alt="Flux Logo White"
          quality={100}
          style={{ objectPosition: 'left', objectFit: 'contain', alignSelf: 'flex-start', filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.8))' }}
        />
      </AnimatedContainer>
      <AnimatedContainer style={{ marginTop: 0 }}>
        <ProjectSubtitle style={{ zIndex: 2, fontSize: '20px', fontWeight: 600, marginTop: 0 }} color={Colors.WHITE}>
          {shortDescription}
        </ProjectSubtitle>
      </AnimatedContainer>
    </>
  );
};

export default function Flux() {
  const [theme] = useTheme();
  return (
    <>
      <DetailedNavbar />
      <ProjectContainer>
        <ProjectTitleContainer>
          {theme === "light" ? (
            <Image
              src={FluxColoredLogo}
              width={42}
              height={42}
              alt="Flux Logo Colored"
              quality={25}
              style={{ alignSelf: 'flex-end', marginRight: '8px', marginBottom: '4px' }}
            />
          ) : (
            <Image
              src={FluxBlackLogo}
              height={50}
              width={50}
              alt="Flux Logo"
              style={{ fill: 'white', alignSelf: 'flex-start' }}
            />
          )}
        </ProjectTitleContainer>
        <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
        <FadeAnimatedContainer direction="column">
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
            <ProjectContentHeader>
              🎯 One mission, one goal
            </ProjectContentHeader>
            <ProjectContentText>
              Flux exists to help young people learn about money, stay on top of
              their credit health, and get the chance to win $250,000! We help
              engage and excite people about money using gamification and modern
              design so people can make more informed decisions about their
              finances without falling asleep.
            </ProjectContentText>
          </FadeAnimatedContainer>

          <FadeAnimatedContainer direction="column" layoutId={`header-${id}-2`}>
            <ProjectContentHeader>💰 Win the Week</ProjectContentHeader>
            <ProjectContentSubheader color={Colors.FLUX_GREEN}>
              Win up to $250,000 just by saving $25
            </ProjectContentSubheader>
            <ProjectContentText>
              We've created a simple game. Save $25 and guess a 7 digit number
              to win up to $250,000. ‍Guaranteed winners every week.
            </ProjectContentText>
          </FadeAnimatedContainer>
        </ProjectContentContainer>
      </ProjectContainer>
    </>
  );
}
