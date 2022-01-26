import { HTMLMotionProps } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { ProjectButtons } from "../../components/project/button-container";
import { AnimatedContainer, FadeAnimatedContainer } from "../container";
import {
  CloseButton,
  ProjectContainerExpanded,
  ProjectContent,
  ProjectProps,
} from "./index";

type AnimatedProjectProps = ProjectProps &
  HTMLMotionProps<"div"> & { onClose?: () => void };
export const AnimatedProject: React.FC<AnimatedProjectProps> = ({
  projectId,
  className,
  component,
  links,
  onClose,
}) => {
  const Component = component;
  return (
    <ProjectContainerExpanded
      layoutId={`container-${projectId}`}
      className={className}
    >
      <ProjectContent layoutId={`content-${projectId}`}>
        <FadeAnimatedContainer
          style={{ pointerEvents: "auto", top: 0, position: "relative" }}
        >
          <CloseButton href="/projects" />
        </FadeAnimatedContainer>
        <ComponentContainer flex="1" direction="row">
          <AnimatedContainer direction="column">
            <Component />
          </AnimatedContainer>
        </ComponentContainer>
        <ProjectButtons {...links} />
      </ProjectContent>
    </ProjectContainerExpanded>
  );
};

const ComponentContainer = styled(AnimatedContainer).attrs({
  direction: "row",
})`
  display: block;
  overflow: auto;
  overflow-x: hidden;
  height: 75vh;
  overflow-wrap: break-word;
  margin-bottom: 12px;
`;
