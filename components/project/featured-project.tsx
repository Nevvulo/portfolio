import Image from "next/image";
import styled from "styled-components";
import GolfquestBanner from "../../assets/img/games/golfquest.png";
import FluxBanner from "../../assets/img/projects/banner/flux.png";
import UnloanBanner from "../../assets/img/projects/banner/unloan.png";
import type { Doc } from "../../convex/_generated/dataModel";
import { StrippedLink } from "../generics";

const projectBanners = {
  flux: FluxBanner,
  unloan: UnloanBanner,
  golfquest: GolfquestBanner,
} as const;

function getProjectBanner(slug: string) {
  return projectBanners[slug as keyof typeof projectBanners] || FluxBanner;
}

interface FeaturedProjectCardProps {
  project: Doc<"projects">;
  href: string;
  isSmaller?: boolean;
}

export function FeaturedProjectCard({
  project,
  href,
  isSmaller = false,
}: FeaturedProjectCardProps) {
  const banner = getProjectBanner(project.slug);

  return (
    <LinkWrapper href={href}>
      <Container isSmaller={isSmaller}>
        <ImageWrapper>
          <Image
            src={banner}
            alt={`${project.name} project banner`}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </ImageWrapper>
        <ColorGradient $gradient={project.background} />
        <ContentWrapper>
          {project.logoUrl && project.logoWidth && project.logoHeight ? (
            project.logoIncludesName ? (
              // Logo includes name - show logo only
              <LogoImage
                src={project.logoUrl}
                width={Math.min(project.logoWidth, 160)}
                height={Math.min(project.logoHeight, 60)}
                alt={`${project.name} logo`}
                style={{ objectFit: "contain" }}
              />
            ) : (
              // Logo doesn't include name - show [image] [text] horizontally
              <LogoWithTitle>
                <LogoImage
                  src={project.logoUrl}
                  width={Math.min(project.logoWidth, 40)}
                  height={Math.min(project.logoHeight, 40)}
                  alt={`${project.name} logo`}
                  style={{ objectFit: "contain" }}
                />
                <ProjectName>{project.name}</ProjectName>
              </LogoWithTitle>
            )
          ) : (
            // No logo - show title only
            <ProjectName>{project.name}</ProjectName>
          )}
          <ProjectDescription>{project.shortDescription}</ProjectDescription>
        </ContentWrapper>
      </Container>
    </LinkWrapper>
  );
}

const LinkWrapper = styled(StrippedLink)`
  display: block;
  width: 100%;
`;

const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isSmaller"].includes(prop),
})<{ isSmaller?: boolean }>`
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  width: 100%;
  height: ${(props) => (props.isSmaller ? "280px" : "350px")};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    height: ${(props) => (props.isSmaller ? "400px" : "450px")};
  }
`;

const ImageWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  img {
    z-index: 0 !important;
  }
`;

const ColorGradient = styled.div<{ $gradient?: string }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 135%;
  background: rgba(0, 0, 0, 0.3);
  background-image: ${(props) => props.$gradient || "none"};
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgb(0, 0, 0) 100%);
  mask-image: linear-gradient(180deg, transparent 0%, rgb(0, 0, 0) 100%);
  z-index: 1;
  pointer-events: none;
`;

const ContentWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5em 2em 2em 2em;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const LogoImage = styled(Image)`
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));
`;

const LogoWithTitle = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
`;

const ProjectName = styled.h2`
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const ProjectDescription = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.4;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

// Legacy component for static game data (non-Convex)
interface FeaturedProjectPreviewProps {
  projectId: string;
  background: string;
  href: string;
  preview?: React.ComponentType;
}

export function FeaturedProjectPreview({
  projectId,
  background,
  href,
  preview: Preview,
}: FeaturedProjectPreviewProps) {
  const banner = getProjectBanner(projectId);

  return (
    <LinkWrapper href={href}>
      <Container>
        <ImageWrapper>
          <Image
            src={banner}
            alt={`${projectId} project banner`}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </ImageWrapper>
        <ColorGradient $gradient={background} />
        <ContentWrapper>{Preview && <Preview />}</ContentWrapper>
      </Container>
    </LinkWrapper>
  );
}
