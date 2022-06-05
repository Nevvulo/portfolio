import React from "react";
import styled from "styled-components";
import { ProjectPreviewImage, ProjectProps, ProjectStyleProps } from ".";
import { ProjectContent } from ".";
import { StrippedLink } from "../generics";
import FluxBanner from "../../assets/img/projects/banner/flux.png";

type ProjectPreviewProps = ProjectProps & ProjectStyleProps & { href: string };
export function FeaturedProjectPreview({
  projectId,
  preview: Component,
  background,
  href,
}: ProjectPreviewProps) {
  return (
    <StrippedLink passHref href={href}>
      <Container>
        <ProjectPreviewImage
          placeholder="blur"
          priority
          quality={50}
          src={FluxBanner}
        ></ProjectPreviewImage>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            paddingTop: "2em",
          }}
        >
          <ProjectPreviewContainer
            background={background}
          ></ProjectPreviewContainer>
          <ProjectContent>
            <Component />
          </ProjectContent>
        </div>
      </Container>
    </StrippedLink>
  );
}

const Container = styled.div`
  position: relative;
  width: auto;
  max-width: 650px;
  cursor: pointer;
  border-radius: 6px;
  width: 100%;
  min-width: 450px;
  margin: 1em;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.3);

  @media (max-width: 512px) {
    min-width: 200px;
  }

  > div {
    display: block !important;
    border-radius: 8px;
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
