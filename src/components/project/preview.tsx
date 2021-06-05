import React from "react";
import {
  ProjectContainer,
  ProjectContent,
  ProjectProps,
  ProjectStyleProps,
} from ".";

export const ProjectPreview: React.FC<
  ProjectProps &
    ProjectStyleProps & { className?: string; style: any; hidden?: boolean }
> = ({ projectId, style, preview, background, className, hidden }) => {
  const Component = preview;
  return (
    <ProjectContainer
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
