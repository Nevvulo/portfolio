import { motion } from "framer-motion";
import styled from "styled-components";
import { AnimatedContainer, Container } from "../container";
import { Link } from "../generics";

export const ProjectContainer = styled(AnimatedContainer)`
  flex: 1 1 100%;
`;

export const ProjectContentContainer = styled(Container)`
  border-radius: 8px;
  padding: 1em 0.25em;
  width: 100%;

  @media (max-width: 468px) {
    padding: 4px;
  }
`;

export const ProjectContainerExpanded = styled(AnimatedContainer)`
  position: fixed;
  top: 0;
  z-index: 1;
  width: 100%;
  height: 100%;

  > div {
    margin: 0;
  }
`;

export const ProjectContent = styled(motion.div)<any>`
  padding: 1.5em 2em 2.5em 2em;
  overflow: hidden;
  z-index: 0;
  background: ${(props) => props.background};
  margin: 1em;
  width: 100%;
  cursor: ${(props) => (props.pointer ? "pointer" : "auto")};
  border-radius: 6px;
`;

export const ProjectTitleContainer = styled(AnimatedContainer)`
  align-items: center;
  padding: 0.25em 0;
`;

export const ProjectTitle = styled(motion.h1)`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: white;
  line-height: 48px;
  font-size: 48px;
  margin-bottom: 0px;
  margin-top: 4px;

  @media (max-width: 468px) {
    font-size: 36px;
  }
`;

export const ProjectSubtitle = styled(motion.h2)`
  font-family: "RobotoCondensed", sans-serif;
  font-weight: 400;
  color: ${(props) => props.color || "#c2c2c2"};
  font-size: 18px;
  margin: 0;
`;

export const ProjectContentHeader = styled(motion.h3)`
  font-family: "Inter", sans-serif;
  font-weight: 700;
  color: #fefefe;
  font-size: 26px;
  margin-top: 4px;
  margin-bottom: 2px;
`;

export const ProjectContentSubheader = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: ${(props) => props.color || "#fff"};
  font-size: 16px;
  margin-top: 4px;
  margin-bottom: 2px;
`;

export const ProjectContentText = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-weight: 400;
  color: #b0b0b0;
  font-size: 16px;
  margin-top: 4px;
`;

export const ProjectImage = motion.img;

export const CloseButton = styled(Link)`
  position: absolute;
  top: 0px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 360px;
  right: 0px;
  margin-left: auto;
  width: 32px;
  height: 32px;
  font-size: 0;
  cursor: pointer;
  z-index: 2;

  :before,
  :after {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 3px;
    height: 20px;
    background-color: #f0f0f0;
    transform: rotate(45deg) translate(-50%, -50%);
    transform-origin: top left;
    content: "";
  }

  :after {
    transform: rotate(-45deg) translate(-50%, -50%);
  }
`;

export interface ProjectStyleProps {
  background?: string;
  pointer?: boolean;
}

export interface Links {
  github?: string;
  website?: string;
}

export interface ProjectProps extends ProjectStyleProps {
  projectId: string;
  preview: React.FC;
  component: any;
  maintained?: boolean;
  links?: Links;
}

export * from "./animated-project";
export * from "./badges";
export * from "./button";
export * from "./button-container";
export * from "./preview";