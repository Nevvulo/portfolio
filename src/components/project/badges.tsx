import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { RoleColors, RoleNames, Roles } from "../../constants/roles";
import {
  Technologies,
  TechnologiesColors,
  TechnologiesNames,
} from "../../constants/technologies";
import { Container } from "../container";

interface BadgesProps {
  technologies: Technologies[];
  roles: Roles[];
}
export const ProjectBadges: React.FC<BadgesProps> = ({
  roles,
  technologies,
}) => (
  <BadgesContainer direction="row">
    <Container direction="column">
      <Subtitle>Roles</Subtitle>
      <Container direction="row">
        {roles.map((role) => (
          <Badge key={role} background={RoleColors[role]}>
            {RoleNames[role]}
          </Badge>
        ))}
      </Container>
    </Container>

    {technologies.length && (
      <Container direction="column">
        <Subtitle>Technologies Used</Subtitle>
        <Container direction="row">
          {technologies?.map((role) => (
            <Badge key={role} background={TechnologiesColors[role]}>
              {TechnologiesNames[role]}
            </Badge>
          ))}
        </Container>
      </Container>
    )}
  </BadgesContainer>
);

type BadgeProps = { background: string };
const Badge = styled(motion.div)<BadgeProps>`
  padding: 0.35em;
  font-family: "Inter", sans-serif;
  border-radius: 6px;
  background: ${(props) => props.background};
  margin-right: 12px;
  margin-bottom: 6px;
  font-size: 0.75em;
  overflow: hidden;
  width: auto;
  height: 12px;
  color: white;
  text-transform: uppercase;
`;

const BadgesContainer = styled(Container)`
  border-radius: 12px;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 1em 12px;
  overflow-x: auto;
  margin: 12px 0;
`;

const Subtitle = styled.p`
  text-transform: uppercase;
  font-size: 14px;
  font-family: "Inter", sans-serif;
  letter-spacing: -0.25px;
  margin: 0.4em 0;
  font-weight: 600;
  color: #c7c7c7;
`;
