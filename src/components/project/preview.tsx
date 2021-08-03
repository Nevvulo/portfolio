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
> = ({ projectId, style, preview, background, className, hidden, onClick }) => {
  const Component = preview;
  return (
    <ProjectContainer
      layout
      onClick={onClick}
      style={{ ...style, display: hidden ? "none" : void 0 }}
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
