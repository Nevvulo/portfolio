import Image from "next/image";
import styled from "styled-components";
import { StrippedLink } from "../generics";
import type { ProjectProps, ProjectStyleProps } from ".";
import { ProjectContent } from ".";

export const ProjectPreviewImage = styled(Image)`
  display: block;
  border: none;
  background: none;
  border-radius: 8px;
`;

type ProjectPreviewProps = ProjectProps & ProjectStyleProps & { href: string };
export function ProjectPreview({ preview: Component, background, href }: ProjectPreviewProps) {
  return (
    <StrippedLink passHref href={href}>
      <ProjectPreviewContainer background={background}>
        <ProjectContent>
          <Component />
        </ProjectContent>
      </ProjectPreviewContainer>
    </StrippedLink>
  );
}

const ProjectPreviewContainer = styled.div<ProjectStyleProps>`
  background: ${(props) => props.background};
  cursor: pointer;
  border-radius: 6px;
  width: 650px;
  max-width: 650px;
  margin: 1em;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.5);

  @media (max-width: 700px) {
    width: calc(100vw - 3em);
    max-width: calc(100vw - 3em);
  }
`;
