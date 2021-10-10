import React from "react";
import styled from "styled-components";
import {
  ProjectContainer,
  ProjectContent,
  ProjectProps,
  ProjectStyleProps,
} from ".";

const Container = styled.div<any>`
  background: ${(props) => props.background};
  width: auto;
  max-width: 450px;
  cursor: pointer;
  border-radius: 6px;
  width: 100%;
  margin: 1em;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.5);
`;

export const ProjectPreview: React.FC<
  ProjectProps &
    ProjectStyleProps & {
      className?: string;
      style?: any;
      hidden?: boolean;
      onClick?: any;
    }
> = ({ projectId, preview, background, className, hidden, onClick }) => {
  const Component = preview;
  return (
    <Container onClick={onClick} className={className} background={background}>
      <ProjectContent pointer layoutId={`content-${projectId}`}>
        <Component />
      </ProjectContent>
    </Container>
  );
};
