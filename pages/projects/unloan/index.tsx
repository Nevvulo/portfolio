import Image from "next/image";
import type React from "react";
import UnloanLogo from "../../../assets/svg/projects/logo/unloan-logo-black.svg";
import UnloanWhiteLogo from "../../../assets/svg/projects/logo/unloan-white.svg";
import { AnimatedContainer, FadeAnimatedContainer } from "../../../components/container";
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

const id = "unloan";
const shortDescription = "Australia's first digital home loan";

export const UnloanPreview: React.FC = () => {
  return (
    <>
      <AnimatedContainer style={{ marginBottom: "0.5em", marginTop: "-2em" }}>
        <Image
          src={UnloanWhiteLogo}
          height={50}
          width={208}
          alt="Unloan Logo White"
          quality={100}
          style={{
            objectPosition: "center",
            objectFit: "contain",
            alignSelf: "center",
            filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.6))",
          }}
        />
      </AnimatedContainer>
      <AnimatedContainer style={{ marginTop: "0.5em" }}>
        <ProjectSubtitle
          style={{
            zIndex: 2,
            fontSize: "20px",
            fontWeight: 600,
            marginTop: 0,
            textAlign: "center",
          }}
          color={Colors.WHITE}
        >
          {shortDescription}
        </ProjectSubtitle>
      </AnimatedContainer>
    </>
  );
};

export default function Unloan() {
  const [theme] = useTheme();
  return (
    <>
      <DetailedNavbar />
      <ProjectContainer>
        <ProjectTitleContainer>
          {theme === "light" ? (
            <Image
              src={UnloanLogo}
              width={96}
              height={23}
              alt="Unloan Logo"
              quality={25}
              style={{ alignSelf: "flex-end", marginRight: "8px", marginBottom: "4px" }}
            />
          ) : (
            <Image
              src={UnloanWhiteLogo}
              height={23}
              width={96}
              alt="Unloan Logo White"
              style={{ alignSelf: "flex-start" }}
            />
          )}
        </ProjectTitleContainer>
        <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
        <FadeAnimatedContainer direction="column">
          <ProjectBadges
            technologies={[Technologies.REACT, Technologies.TYPESCRIPT, Technologies.NODEJS]}
            roles={[Roles.DEVELOPER]}
          />
        </FadeAnimatedContainer>

        <ProjectContentContainer direction="column">
          <FadeAnimatedContainer direction="column" layoutId={`header-${id}-1`}>
            <ProjectContentHeader>🏠 Digital home loans, simplified</ProjectContentHeader>
            <ProjectContentText>
              Unloan is Australia's first digital home loan built by Commonwealth Bank. We've
              reimagined the home loan experience with modern technology and transparent pricing to
              make homeownership more accessible for Australians.
            </ProjectContentText>
          </FadeAnimatedContainer>

          <FadeAnimatedContainer direction="column" layoutId={`header-${id}-2`}>
            <ProjectContentHeader>💡 Innovation at CBA</ProjectContentHeader>
            <ProjectContentSubheader color={Colors.UNLOAN_YELLOW}>
              Building the future of home lending
            </ProjectContentSubheader>
            <ProjectContentText>
              Working at Unloan for Commonwealth Bank, I help develop cutting-edge fintech solutions
              that leverage CBA's banking expertise with modern technology. Our focus is on creating
              user-friendly interfaces and seamless experiences that make getting a home loan as
              simple as possible.
            </ProjectContentText>
          </FadeAnimatedContainer>

          <FadeAnimatedContainer direction="column" layoutId={`header-${id}-3`}>
            <ProjectContentHeader>🚀 Modern technology stack</ProjectContentHeader>
            <ProjectContentText>
              Built with React and TypeScript for the frontend, with robust Node.js services
              powering the backend. We focus on performance, security, and user experience to
              deliver a best-in-class digital lending platform.
            </ProjectContentText>
          </FadeAnimatedContainer>
        </ProjectContentContainer>
      </ProjectContainer>
    </>
  );
}
