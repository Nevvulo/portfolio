import { motion } from "framer-motion";
import styled from "styled-components";
import { AnimatedContainer, Container } from "../container";
import { Link } from "../generics";
import { MinimalView } from "../views/minimal";

export const ProjectView = styled(MinimalView)`
  padding: 1em max(20%, 52px);
  height: 100%;

  @media (max-width: 768px) {
    padding: 1em min(10%, 12px);
  }
`;

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
  z-index: 1;
  position: fixed;
  will-change: opacity;
  margin: 2vh 0;
  top: 0;
  width: 100%;
  justify-content: center;

  > div {
    margin: 0 10%;
    width: 85%;
    max-width: 600px;

    @media (max-width: 468px) {
      margin: 1em;
      height: 82.5vh;
    }
  }

  @media (max-width: 468px) {
    padding: 0;
    width: 100% !important;
    margin: 0;
  }

  @media (max-width: 360px) {
    max-width: 100%;
  }
`;

export const ProjectContent = styled(motion.div).attrs({
  testId: "project",
})<ProjectStyleProps>`
  padding: 1.5em 2em 2.5em 2em;
  overflow: hidden;
  max-height: 90vh;
  z-index: 0;
  background: ${(props) => props.background};
  margin: 1em;
  border-radius: 24px;
  box-shadow: inset 0px -20px 0px 0px rgb(20 20 20 / 50%),
    5px 5px 15px rgba(0, 0, 0, 0.6);
  width: 100%;
  cursor: ${(props) => (props.pointer ? "pointer" : "auto")};

  @media (max-width: 468px) {
    padding: 1.25em 1.75em 2.25em 1.75em;
  }
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
  component: React.FC;
  maintained?: boolean;
  links?: Links;
}

export * from "./animated-project";
export * from "./badges";
export * from "./button";
export * from "./button-container";
export * from "./preview";
