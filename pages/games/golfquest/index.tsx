import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";
import RobloxLogo from "../../../assets/svg/roblox.svg";
import { AnimatedContainer, FadeAnimatedContainer } from "../../../components/container";
import { SimpleNavbar } from "../../../components/navbar/simple";
import {
  ProjectContainer,
  ProjectContentContainer,
  ProjectContentHeader,
  ProjectContentText,
  ProjectSubtitle,
  ProjectTitleContainer,
} from "../../../components/project";
import Colors from "../../../constants/colors";

const id = "golfquest";
const shortDescription = "A golf adventure game on Roblox";

const Golfquest: React.FC = () => {
  return (
    <>
      <SimpleNavbar backRoute="/games" />
      <ProjectContainer style={{ position: "relative" }}>
        <DevBanner>
          <DevBannerIcon>🚧</DevBannerIcon>
          <DevBannerText>In Development</DevBannerText>
        </DevBanner>
        <ProjectTitleContainer>
          <TitleRow>
            <GameTitle>Golfquest</GameTitle>
            <RobloxLogoWrapper>
              <Image
                src={RobloxLogo}
                alt="Roblox"
                width={100}
                height={28}
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </RobloxLogoWrapper>
          </TitleRow>
        </ProjectTitleContainer>
        <ProjectSubtitle>{shortDescription}</ProjectSubtitle>
        <FadeAnimatedContainer direction="column">
          <BadgeContainer>
            <GameBadge $color="#10b981">Golf</GameBadge>
            <GameBadge $color="#f59e0b">Adventure</GameBadge>
          </BadgeContainer>
        </FadeAnimatedContainer>

        <ProjectContentContainer direction="column">
          <FadeAnimatedContainer direction="column" layoutId={`header-${id}-1`}>
            <ProjectContentHeader>⛳ Golf meets adventure</ProjectContentHeader>
            <ProjectContentText>
              Golfquest is an exciting golf adventure game built on Roblox. Combining the precision
              of golf with the thrill of exploration, players embark on a journey through
              beautifully crafted courses filled with challenges and hidden secrets.
            </ProjectContentText>
          </FadeAnimatedContainer>

          <FadeAnimatedContainer direction="column" layoutId={`header-${id}-2`}>
            <ProjectContentHeader>🎮 Features</ProjectContentHeader>
            <ProjectContentText>
              Refined physics and controls for an authentic golf experience. Explore diverse
              environments, play with friends, compete on leaderboards, and unlock cosmetics to
              personalize your player.
            </ProjectContentText>
          </FadeAnimatedContainer>
        </ProjectContentContainer>
      </ProjectContainer>

      <Head>
        <title>Golfquest - nevulo</title>
        <meta
          name="description"
          content="Golfquest is an exciting golf adventure game on Roblox. Explore unique courses, master golf mechanics, and compete with friends!"
        />
        <meta property="og:title" content="Golfquest - nevulo" />
        <meta
          property="og:description"
          content="An exciting golf adventure game on Roblox combining precision golf with exploration and multiplayer fun."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="nevulo" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Golfquest&subtitle=Roblox%20Golf%20Adventure%20Game"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Golfquest - nevulo" />
        <meta name="twitter:description" content="An exciting golf adventure game on Roblox." />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Golfquest&subtitle=Roblox%20Golf%20Adventure%20Game"
        />
      </Head>
    </>
  );
};

export const GolfquestPreview = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <AnimatedContainer>
        <PreviewTitle>Golfquest</PreviewTitle>
      </AnimatedContainer>
      <AnimatedContainer>
        <ProjectSubtitle
          style={{
            zIndex: 2,
            fontSize: "20px",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
          color={Colors.WHITE}
        >
          {shortDescription}
        </ProjectSubtitle>
      </AnimatedContainer>
    </div>
  );
};

// Styled Components
const DevBanner = styled.div`
  position: absolute;
  top: 1rem;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 6px;

  @media (max-width: 768px) {
    position: static;
    margin-left: auto;
    margin-bottom: 0.5rem;
  }
`;

const DevBannerIcon = styled.span`
  font-size: 16px;
`;

const DevBannerText = styled.span`
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #f59e0b;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RobloxLogoWrapper = styled.div`
  display: flex;
  align-items: center;
  opacity: 0.9;
`;

const GameTitle = styled.h1`
  font-family: var(--font-sans);
  font-weight: 800;
  font-size: 48px;
  color: ${(props) => props.theme.contrast};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 36px;
  }
`;

const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const GameBadge = styled.span<{ $color: string }>`
  background: ${(props) => props.$color}22;
  border: 1.5px solid ${(props) => props.$color};
  color: ${(props) => props.$color};
  padding: 6px 14px;
  border-radius: 20px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const PreviewTitle = styled.h3`
  font-family: var(--font-sans);
  font-weight: 800;
  font-size: 36px;
  color: ${Colors.WHITE};
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

export default Golfquest;
