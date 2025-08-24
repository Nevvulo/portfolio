import Image from "next/image";
import styled from "styled-components";
import FluxBanner from "../../assets/img/projects/banner/flux.png";
import UnloanBanner from "../../assets/img/projects/banner/unloan.png";
import { StrippedLink } from "../generics";
import { ProjectContent, type ProjectProps, type ProjectStyleProps } from ".";

const projectBanners = {
  flux: FluxBanner,
  unloan: UnloanBanner,
} as const;

function getProjectBanner(projectId: string) {
  return projectBanners[projectId as keyof typeof projectBanners] || FluxBanner;
}

function getBannerAlt(projectId: string) {
  const projectNames = {
    flux: "Flux",
    unloan: "Unloan",
  } as const;
  return `${projectNames[projectId as keyof typeof projectNames] || "Project"} project banner`;
}

type ProjectPreviewProps = ProjectProps &
  ProjectStyleProps & { href: string; projectId: string; isSmaller?: boolean };
export function FeaturedProjectPreview({
  preview: Component,
  background,
  href,
  projectId,
  isSmaller = false,
}: ProjectPreviewProps) {
  return (
    <StrippedLink passHref href={href}>
      <Container isSmaller={isSmaller}>
        <ImageWrapper isSmaller={isSmaller}>
          <Image
            alt={getBannerAlt(projectId)}
            placeholder="blur"
            priority
            quality={50}
            src={getProjectBanner(projectId)}
            width={650}
            height={isSmaller ? 280 : 350}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </ImageWrapper>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            paddingTop: "2em",
          }}
        >
          <ProjectPreviewContainer background={background}></ProjectPreviewContainer>
          <ProjectContent>
            <Component />
          </ProjectContent>
        </div>
      </Container>
    </StrippedLink>
  );
}

const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isSmaller"].includes(prop),
})<{ isSmaller?: boolean }>`
  position: relative;
  cursor: pointer;
  border-radius: 6px;
  width: 650px;
  max-width: 650px;
  margin: 1em;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.5);
  overflow: hidden;

  @media (max-width: 700px) {
    width: calc(100vw - 3em);
    max-width: calc(100vw - 3em);
  }
`;

const ImageWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isSmaller"].includes(prop),
})<{ isSmaller?: boolean }>`
  position: relative;
  width: 100%;
  height: ${(props) => (props.isSmaller ? "280px" : "350px")};
  overflow: hidden;
  
  img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
`;

const ProjectPreviewContainer = styled.div<ProjectStyleProps>`
  position: absolute;
  bottom: 0;
  padding-top: 2em;
  width: 100%;
  height: 135%;
  border-end-end-radius: 6px;
  border-end-start-radius: 6px;

  background: rgba(0, 0, 0, 0.3);
  background-image: ${(props) => props.background};
  -webkit-mask-image: linear-gradient(
    180deg,
    transparent 0%,
    rgb(0, 0, 0) 100%
  );
`;
