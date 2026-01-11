import { m } from "framer-motion";
import type React from "react";
import styled from "styled-components";
import { RoleColors, RoleNames, type Roles } from "../../constants/roles";
import {
  type Technologies,
  TechnologiesColors,
  TechnologiesNames,
} from "../../constants/technologies";
import { Container } from "../container";

interface BadgesProps {
  technologies: Technologies[];
  roles: Roles[];
}
export const ProjectBadges: React.FC<BadgesProps> = ({ roles, technologies }) => {
  return (
    <BadgesContainer direction="row">
      <Container direction="column">
        <Subtitle>Roles</Subtitle>
        <BadgeRow direction="row">
          {roles.map((role) => (
            <Badge key={role} $background={RoleColors[role]}>
              {RoleNames[role]}
            </Badge>
          ))}
        </BadgeRow>
      </Container>

      {technologies.length > 0 ? (
        <Container direction="column">
          <Subtitle>Technologies Used</Subtitle>
          <BadgeRow direction="row">
            {technologies?.map((role) => (
              <Badge key={role} $background={TechnologiesColors[role]}>
                {TechnologiesNames[role]}
              </Badge>
            ))}
          </BadgeRow>
        </Container>
      ) : null}
    </BadgesContainer>
  );
};

type BadgeProps = { $background: string };
const Badge = styled(m.div)<BadgeProps>`
  padding: 0.6em 0.75em;
  font-family: var(--font-sans);
  letter-spacing: -0.2px;
  font-weight: 600;
  border-radius: 6px;
  background: ${(props) => props.$background};
  margin-right: 12px;
  margin-bottom: 6px;
  font-size: 0.875em;
  white-space: nowrap;
  color: white;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  line-height: 1.2;

  @media (max-width: 768px) {
    margin-right: 8px;
    margin-bottom: 4px;
    font-size: 0.8em;
    padding: 0.55em 0.7em;
  }

  @media (max-width: 468px) {
    margin-right: 6px;
    margin-bottom: 3px;
    font-size: 0.7em;
    padding: 0.5em 0.65em;
  }
`;

const BadgesContainer = styled(Container)`
  border-radius: 12px;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 1em 12px;
  overflow-x: auto;
  margin: 12px 0;

  @media (max-width: 768px) {
    flex-direction: column !important;
    padding: 0.75em 8px;
  }

  @media (max-width: 468px) {
    padding: 0.5em 6px;
    margin: 8px 0;
  }
`;

const BadgeRow = styled(Container)`
  flex-wrap: wrap;
  gap: 0.25em;

  @media (max-width: 468px) {
    gap: 0.125em;
  }
`;

const Subtitle = styled.p`
  text-transform: uppercase;
  font-size: 14px;
  font-family: var(--font-sans);
  letter-spacing: -0.25px;
  margin: 0.5em 0 0.4em 0;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};

  @media (max-width: 468px) {
    font-size: 12px;
    margin: 0.35em 0 0.25em 0;
  }
`;
