import { m } from "framer-motion";
import { ExternalLink, Github, X } from "lucide-react";
import Image from "next/image";
import styled from "styled-components";
import type { Project, Technology, Role } from "@/src/db/types";
import { useTheme } from "../../hooks/useTheme";

interface ProjectExpandedProps {
  project: Project;
  onClose: () => void;
  technologies: Map<string, Technology>;
  roles: Map<string, Role>;
}

export function ProjectExpanded({ project, onClose, technologies, roles }: ProjectExpandedProps) {
  const [theme] = useTheme();

  const timeline = project.timeline as { startYear: number; endYear?: number };
  const links = project.links as { github?: string; website?: string } | null;
  const techKeys = (project.technologies ?? []) as string[];
  const roleKeys = (project.roles ?? []) as string[];
  const contentSections = (project.contentSections ?? []) as Array<{
    id: string;
    emoji?: string;
    header: string;
    subheader?: string;
    subheaderColor?: string;
    text: string;
  }>;

  // Resolve tech and role badges from the maps
  const resolvedTechnologies = techKeys.map((key) => technologies.get(key)).filter(Boolean) as Technology[];
  const resolvedRoles = roleKeys.map((key) => roles.get(key)).filter(Boolean) as Role[];

  const logoUrl = theme === "light" && project.logoDarkUrl ? project.logoDarkUrl : project.logoUrl;

  const timelineText = timeline.endYear
    ? `${timeline.startYear} — ${timeline.endYear}`
    : `${timeline.startYear} — Present`;

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <ExpandedCard
        layoutId={`project-card-${project.slug}`}
        onClick={(e) => e.stopPropagation()}
        $background={project.background}
      >
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>

        <CardHeader>
          {logoUrl && project.logoWidth && project.logoHeight && (
            <LogoContainer layoutId={`project-logo-${project.slug}`}>
              <Image
                src={logoUrl}
                width={Math.min(project.logoWidth, 120)}
                height={Math.min(project.logoHeight, 120)}
                alt={`${project.name} Logo`}
                style={{ objectFit: "contain" }}
              />
            </LogoContainer>
          )}
          <TitleSection>
            <ProjectName layoutId={`project-name-${project.slug}`}>{project.name}</ProjectName>
            <ProjectSubtitle layoutId={`project-subtitle-${project.slug}`}>
              {project.shortDescription}
            </ProjectSubtitle>
          </TitleSection>
        </CardHeader>

        <MetaRow>
          <TimelineBadge>{timelineText}</TimelineBadge>
          {project.maintained && <MaintainedBadge>MAINTAINED</MaintainedBadge>}
        </MetaRow>

        {/* Badges */}
        {(resolvedTechnologies.length > 0 || resolvedRoles.length > 0) && (
          <BadgesContainer
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {resolvedTechnologies.map((tech) => (
              <TechBadge key={tech.key} $color={tech.color}>
                {tech.label}
              </TechBadge>
            ))}
            {resolvedRoles.map((role) => (
              <RoleBadge key={role.key} $color={role.color} title={role.description}>
                {role.label}
              </RoleBadge>
            ))}
          </BadgesContainer>
        )}

        {/* Links */}
        {links && (links.github || links.website) && (
          <LinksRow
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {links.github && (
              <LinkButton href={links.github} target="_blank" rel="noopener noreferrer">
                <Github size={16} />
                GitHub
              </LinkButton>
            )}
            {links.website && (
              <LinkButton href={links.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} />
                Website
              </LinkButton>
            )}
          </LinksRow>
        )}

        {/* Content Sections */}
        <ContentSections>
          {contentSections.map((section, index) => (
            <ContentSection
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <SectionHeader>
                {section.emoji && <SectionEmoji>{section.emoji}</SectionEmoji>}
                {section.header}
              </SectionHeader>
              {section.subheader && (
                <SectionSubheader $color={section.subheaderColor}>
                  {section.subheader}
                </SectionSubheader>
              )}
              <SectionText>{section.text}</SectionText>
            </ContentSection>
          ))}
        </ContentSections>
      </ExpandedCard>
    </Overlay>
  );
}

const Overlay = styled(m.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;

  @media (max-width: 767px) {
    padding: 12px;
    align-items: flex-start;
  }
`;

const ExpandedCard = styled(m.div)<{ $background?: string }>`
  position: relative;
  width: 100%;
  max-width: 650px;
  max-height: 90vh;
  overflow-y: auto;
  background: ${(p) => p.theme.background || "#151515"};
  border-radius: 24px;
  padding: 32px;

  @media (max-width: 767px) {
    padding: 20px;
    border-radius: 16px;
    max-height: 95vh;
    margin: auto 0;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    background: ${(p) => p.$background || "linear-gradient(135deg, #333, #444)"};
    border-radius: 24px 24px 0 0;
    opacity: 0.3;
    z-index: 0;

    @media (max-width: 767px) {
      height: 80px;
      border-radius: 16px 16px 0 0;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: scale(1.1);
  }
`;

const CardHeader = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 767px) {
    gap: 12px;
  }
`;

const LogoContainer = styled(m.div)`
  flex-shrink: 0;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProjectName = styled(m.h1)`
  font-size: 28px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
  margin: 0;

  @media (max-width: 767px) {
    font-size: 22px;
  }
`;

const ProjectSubtitle = styled(m.p)`
  font-size: 16px;
  color: ${(p) => p.theme.textColor};
  margin: 0;

  @media (max-width: 767px) {
    font-size: 14px;
  }
`;

const MetaRow = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  margin-bottom: 20px;
`;

const TimelineBadge = styled.span`
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  font-family: "Sixtyfour", monospace;
`;

const MaintainedBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const BadgesContainer = styled(m.div)`
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const TechBadge = styled.span<{ $color?: string }>`
  background: ${(p) => p.$color || "#333"}40;
  color: ${(p) => p.$color || "#fff"};
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${(p) => p.$color || "#333"}60;
`;

const RoleBadge = styled.span<{ $color?: string }>`
  background: ${(p) => p.$color || "#333"};
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const LinksRow = styled(m.div)`
  position: relative;
  z-index: 1;
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const LinkButton = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: ${(p) => p.theme.contrast};
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ContentSections = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ContentSection = styled(m.div)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionHeader = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0;
`;

const SectionEmoji = styled.span`
  font-size: 20px;
`;

const SectionSubheader = styled.span<{ $color?: string }>`
  font-size: 14px;
  font-weight: 500;
  color: ${(p) => p.$color || p.theme.textColor};
`;

const SectionText = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: ${(p) => p.theme.textColor};
  margin: 0;
  white-space: pre-line;
`;
