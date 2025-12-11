import Image from "next/image";
import styled from "styled-components";
import { m } from "framer-motion";
import FluxBanner from "../../assets/img/projects/banner/flux.png";
import UnloanBanner from "../../assets/img/projects/banner/unloan.png";
import GolfquestBanner from "../../assets/img/games/golfquest.png";
import { StrippedLink } from "../generics";
import type { ProjectProps, ProjectStyleProps } from ".";

const projectBanners = {
  flux: FluxBanner,
  unloan: UnloanBanner,
  golfquest: GolfquestBanner,
} as const;

function getProjectBanner(projectId: string) {
  return projectBanners[projectId as keyof typeof projectBanners] || FluxBanner;
}

function getBannerAlt(projectId: string) {
  const projectNames = {
    flux: "Flux",
    unloan: "Unloan",
    golfquest: "Golfquest",
  } as const;
  return `${projectNames[projectId as keyof typeof projectNames] || "Project"} project banner`;
}

type ProjectPreviewProps = ProjectProps &
  ProjectStyleProps & { href: string; projectId: string; isSmaller?: boolean };
export function FeaturedProjectPreview({
  preview: Component,
  background,
  href,
  projectId,
  isSmaller = false,
}: ProjectPreviewProps) {
  const banner = getProjectBanner(projectId);
  return (
    <LinkWrapper href={href}>
      <Container isSmaller={isSmaller}>
        <ImageWrapper>
          <Image
            src={banner}
            alt={getBannerAlt(projectId)}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </ImageWrapper>
        <ColorGradient $gradient={background} />
        <ContentWrapper>
          <Component />
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
  background-image: ${props => props.$gradient || 'none'};
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgb(0, 0, 0) 100%);
  mask-image: linear-gradient(180deg, transparent 0%, rgb(0, 0, 0) 100%);
  z-index: 1;
  pointer-events: none;
`;

const ContentWrapper = styled(m.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5em 2em 2em 2em;
  z-index: 2;
  pointer-events: none;

  h1 {
    color: white;
  }

  * {
    pointer-events: auto;
  }
`;
