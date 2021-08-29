import React from "react";
import {
  ProjectContainer,
  ProjectContent,
  ProjectProps,
  ProjectStyleProps,
} from ".";

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
    <ProjectContainer
      onClick={onClick}
      layoutId={`container-${projectId}`}
      className={className}
    >
      <ProjectContent
        pointer
        layoutId={`content-${projectId}`}
        background={background}
      >
        <Component />
      </ProjectContent>
    </ProjectContainer>
  );
};
