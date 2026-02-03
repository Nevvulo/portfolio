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
  return projectBanners[slug as keyof typeof projectBanners] || null;
}

function hasProjectBanner(slug: string): boolean {
  return slug in projectBanners;
}

interface FeaturedProjectCardProps {
  project: Doc<"projects">;
  href: string;
  isSmaller?: boolean;
  isSmallest?: boolean;
}

export function FeaturedProjectCard({
  project,
  href,
  isSmaller = false,
  isSmallest = false,
}: FeaturedProjectCardProps) {
  const banner = getProjectBanner(project.slug);
  const hasBanner = hasProjectBanner(project.slug);

  return (
    <LinkWrapper href={href}>
      <Container $isSmaller={isSmaller} $isSmallest={isSmallest}>
        {hasBanner && banner ? (
          <ImageWrapper>
            <Image
              src={banner}
              alt={`${project.name} project banner`}
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </ImageWrapper>
        ) : null}
        <ColorGradient $gradient={project.background} $fullCover={!hasBanner} />
        <DarkCornerOverlay $topLeft={isSmallest} />
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

const Container = styled.div<{ $isSmaller?: boolean; $isSmallest?: boolean }>`
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  width: 100%;
  height: ${(props) => (props.$isSmallest ? "140px" : props.$isSmaller ? "280px" : "350px")};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    height: ${(props) => (props.$isSmallest ? "120px" : props.$isSmaller ? "400px" : "450px")};
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

const ColorGradient = styled.div<{ $gradient?: string; $fullCover?: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: ${(props) => (props.$fullCover ? "100%" : "135%")};
  background: ${(props) => (props.$fullCover ? "none" : "rgba(0, 0, 0, 0.3)")};
  background-image: ${(props) => props.$gradient || "none"};
  -webkit-mask-image: ${(props) =>
    props.$fullCover ? "none" : "linear-gradient(180deg, transparent 0%, rgb(0, 0, 0) 100%)"};
  mask-image: ${(props) =>
    props.$fullCover ? "none" : "linear-gradient(180deg, transparent 0%, rgb(0, 0, 0) 100%)"};
  z-index: 1;
  pointer-events: none;
`;

const DarkCornerOverlay = styled.div<{ $topLeft?: boolean }>`
  position: absolute;
  inset: 0;
  background: ${({ $topLeft }) =>
    $topLeft
      ? `radial-gradient(
          ellipse 130% 110% at 0% 0%,
          rgba(0, 0, 0, 0.7) 0%,
          rgba(0, 0, 0, 0.55) 15%,
          rgba(0, 0, 0, 0.4) 30%,
          rgba(0, 0, 0, 0.2) 50%,
          rgba(0, 0, 0, 0.05) 70%,
          transparent 85%
        )`
      : `radial-gradient(
          ellipse 130% 110% at 0% 100%,
          rgba(0, 0, 0, 0.7) 0%,
          rgba(0, 0, 0, 0.55) 15%,
          rgba(0, 0, 0, 0.4) 30%,
          rgba(0, 0, 0, 0.2) 50%,
          rgba(0, 0, 0, 0.05) 70%,
          transparent 85%
        )`};
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
        <DarkCornerOverlay />
        <ContentWrapper>{Preview && <Preview />}</ContentWrapper>
      </Container>
    </LinkWrapper>
  );
}
