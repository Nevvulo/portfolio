import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import styled from "styled-components";
import { AnimatedContainer } from "../container";
import { ProjectButton } from "./button";

interface ButtonsProps {
  website?: string;
  github?: string;
}

const Buttons: React.FC<ButtonsProps> = ({ website, github }) => (
  <AnimatedContainer
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.15 } }}
    transition={{ duration: 0.2, delay: 0.15 }}
    direction="row"
  >
    {website && (
      <ProjectButton icon={faGlobe} href={website}>
        Website
      </ProjectButton>
    )}
    {github && (
      <ProjectButton icon={faGithub} href={github}>
        GitHub
      </ProjectButton>
    )}
  </AnimatedContainer>
);

export const StyledButtons = styled(Buttons)`
  position: sticky;
  bottom: 0;
  background: rgba(10, 15, 10, 0.75);
  padding: 0.3em;
  border-radius: 8px;
  margin-bottom: 12px;
`;

// TODO: fix this export
export { StyledButtons as ProjectButtons };
