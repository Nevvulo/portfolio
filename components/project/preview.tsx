import React from "react";
import styled from "styled-components";
import type { ProjectProps, ProjectStyleProps } from ".";
import { ProjectContent } from ".";
import { StrippedLink } from "../generics";

type ProjectPreviewProps = ProjectProps & ProjectStyleProps & { href: string };
export function ProjectPreview({
  projectId,
  preview: Component,
  background,
  href,
}: ProjectPreviewProps) {
  return (
    <StrippedLink passHref href={href}>
      <ProjectPreviewContainer background={background}>
        <ProjectContent layoutId={`content-${projectId}`}>
          <Component />
        </ProjectContent>
      </ProjectPreviewContainer>
    </StrippedLink>
  );
}

const ProjectPreviewContainer = styled.div<ProjectStyleProps>`
  background: ${(props) => props.background};
  width: auto;
  max-width: 650px;
  cursor: pointer;
  border-radius: 6px;
  width: 90%;
  min-width: 450px;
  margin: 1em;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.5);

  @media (max-width: 512px) {
    min-width: 200px;
  }
`;
