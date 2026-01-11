import { m } from "framer-motion";
import Image from "next/image";
import styled from "styled-components";
import { StrippedLink } from "../generics";
import type { ProjectProps, ProjectStyleProps } from ".";

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
        <PreviewContent>
          <Component />
        </PreviewContent>
      </ProjectPreviewContainer>
    </StrippedLink>
  );
}

const ProjectPreviewContainer = styled.div<ProjectStyleProps>`
  position: relative;
  background: ${(props) => props.background};
  cursor: pointer;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1);
  }
`;

const PreviewContent = styled(m.div)`
  padding: 1.5em 2em 2em 2em;
  width: 100%;
  z-index: 2;

  h1 {
    color: white;
  }
`;
