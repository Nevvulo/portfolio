import Image from "next/image";
import type React from "react";
import CompassLogo from "../../../assets/img/projects/logo/compass.png";
import { AnimatedContainer, FadeAnimatedContainer } from "../../../components/container";
import { DetailedNavbar } from "../../../components/navbar/detailed";
import {
  ProjectContainer,
  ProjectContentContainer,
  ProjectContentHeader,
  ProjectContentText,
  ProjectSubtitle,
  ProjectTitleContainer,
} from "../../../components/project";
import { ProjectBadges } from "../../../components/project/badges";
import Colors from "../../../constants/colors";
import { Roles } from "../../../constants/roles";
import { Technologies } from "../../../constants/technologies";

const id = "compass";
const shortDescription = "School management solution powering thousands of schools";

export const CompassPreview: React.FC = () => {
  return (
    <>
      <AnimatedContainer style={{ marginBottom: "0.5em", marginTop: "-2em" }}>
        <Image
          src={CompassLogo}
          height={60}
          width={60}
          alt="Compass Education Logo"
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

export default function Compass() {
  return (
    <>
      <DetailedNavbar />
      <ProjectContainer>
        <ProjectTitleContainer>
          <Image
            src={CompassLogo}
            width={40}
            height={40}
            alt="Compass Education Logo"
            quality={100}
            style={{ alignSelf: "flex-start", marginRight: "8px", marginBottom: "4px" }}
          />
        </ProjectTitleContainer>
        <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
        <FadeAnimatedContainer direction="column">
          <ProjectBadges
            technologies={[
              Technologies.REACT,
              Technologies.TYPESCRIPT,
              Technologies.CSHARP,
              Technologies.EFCORE,
              Technologies.SWIFT,
              Technologies.JAVA,
              Technologies.MONGODB,
            ]}
            roles={[Roles.PAST_DEVELOPER]}
          />
        </FadeAnimatedContainer>

        <ProjectContentContainer direction="column">
          <FadeAnimatedContainer direction="column" layoutId={`header-${id}-1`}>
            <ProjectContentHeader>🏫 Educational technology at scale</ProjectContentHeader>
            <ProjectContentText>
              Compass Education is a comprehensive school management platform that serves thousands
              of schools across 5 countries. The platform provides integrated solutions for student
              information management, learning management systems, and parent-school communication
              tools.
            </ProjectContentText>
          </FadeAnimatedContainer>

          <FadeAnimatedContainer direction="column" layoutId={`header-${id}-2`}>
            <ProjectContentHeader>📱 Mobile & web development</ProjectContentHeader>
            <ProjectContentText>
              As a Mobile Software Engineer, I worked on both iOS and Android applications as well
              as web platforms. I implemented new screens, fixed UIKit logic bugs, and contributed
              to improving user experience which led to better app store ratings. My work involved
              React, TypeScript, Swift, and Java development.
            </ProjectContentText>
          </FadeAnimatedContainer>

          <FadeAnimatedContainer direction="column" layoutId={`header-${id}-3`}>
            <ProjectContentHeader>🔧 Legacy system modernization</ProjectContentHeader>
            <ProjectContentText>
              A key part of my role involved modernizing legacy systems and removing technical debt.
              I migrated core functionality from ASP.NET to React and helped transition Visual Basic
              code to C#. I also refactored existing solutions to be more scalable and maintainable,
              and created company presentations on frontend testing best practices.
            </ProjectContentText>
          </FadeAnimatedContainer>
        </ProjectContentContainer>
      </ProjectContainer>
    </>
  );
}
