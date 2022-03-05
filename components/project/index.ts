import { m } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { AnimatedContainer, Container } from "../container";
import { Link } from "../generics";

export const ProjectContainer = styled.div`
  padding: 0 1em;
  max-width: 650px;
  display: flex;
  align-items: flex-start;
  overflow-x: hidden;
  margin-left: auto;
  margin-right: auto;
  flex-direction: column;
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

export const ProjectContent = styled(m.div)`
  padding: 1.5em 2em 2.5em 2em;
  overflow: hidden;
  z-index: 0;

  h1 {
    color: white;
  }
`;

export const ProjectTitleContainer = styled(AnimatedContainer)`
  align-items: center;
  padding: 0.25em 0;
  margin-top: 2em;
`;

export const ProjectSubtitleContainer = styled(AnimatedContainer)`
  align-items: center;
  padding: 0.25em 0;
`;

export const ProjectTitle = styled(m.h1)`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  line-height: 32px;
  font-size: 48px;
  margin-bottom: 8px;
  margin-top: 4px;
  margin-left: 4px;

  [aria-expanded="false"] {
    color: white;
  }

  @media (max-width: 468px) {
    font-size: 36px;
  }
`;

export const ProjectSubtitle = styled(m.h2)`
  font-family: "RobotoCondensed", sans-serif;
  font-weight: 400;
  color: ${(props) => props.color || props.theme.textColor || "#c2c2c2"};
  font-size: 18px;
  margin: 0;
`;

export const ProjectContentHeader = styled(m.h3)`
  font-family: "Inter", sans-serif;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  font-size: 26px;
  margin-top: 4px;
  margin-bottom: 2px;
`;

export const ProjectContentSubheader = styled(m.p)`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-size: 16px;
  margin-top: 4px;
  margin-bottom: 2px;
`;

export const ProjectContentText = styled(m.p)`
  font-family: "Inter", sans-serif;
  font-weight: 400;
  color: #b0b0b0;
  color: ${(props) => props.theme.textColor};
  font-size: 16px;
  margin-top: 4px;
`;

export const ProjectImage = m.img;

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
  component: (...args: unknown[]) => JSX.Element;
  maintained?: boolean;
  links?: Links;
}

export * from "./animated-project";
export * from "./badges";
export * from "./button";
export * from "./button-container";
export * from "./preview";
