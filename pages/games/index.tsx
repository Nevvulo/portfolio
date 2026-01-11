import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";
import GolfquestBanner from "../../assets/img/games/golfquest.png";
import { StrippedLink } from "../../components/generics";
import { SimpleNavbar } from "../../components/navbar/simple";

export default function GamesPage() {
  return (
    <PageWrapper>
      <Background />
      <SimpleNavbar title="Games" />

      <MainContent>
        <GamesGrid>
          {/* Golfquest Card */}
          <GameCard href="/games/golfquest">
            <GameImageWrapper>
              <Image
                src={GolfquestBanner}
                alt="Golfquest"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
              <GameOverlay $gradient="linear-gradient(135deg, #065f46, #047857)" />
            </GameImageWrapper>
            <GameContent>
              <GameBadgeRow>
                <ComingSoonBadge>Coming 2026</ComingSoonBadge>
                <PlatformBadge>Roblox</PlatformBadge>
              </GameBadgeRow>
              <GameTitle>Golfquest</GameTitle>
              <GameDescription>
                A golf adventure game combining precision mechanics with exploration through
                beautifully crafted courses.
              </GameDescription>
              <GameTags>
                <GameTag $color="#10b981">Golf</GameTag>
                <GameTag $color="#f59e0b">Adventure</GameTag>
                <GameTag $color="#3b82f6">Multiplayer</GameTag>
              </GameTags>
            </GameContent>
          </GameCard>

          {/* Secret Project Card */}
          <SecretGameCard>
            <SecretContent>
              <SecretIcon>?</SecretIcon>
              <SecretBadgeRow>
                <ComingSoonBadge $variant="secret">Coming 2027</ComingSoonBadge>
              </SecretBadgeRow>
              <SecretTitle>Secret Project</SecretTitle>
              <SecretDescription>
                Something new is in the works. Reveal coming in a few weeks.
              </SecretDescription>
              <SecretHint>Stay tuned...</SecretHint>
            </SecretContent>
            <SecretGlow />
          </SecretGameCard>
        </GamesGrid>
      </MainContent>

      <Head key="games">
        <title>Games - Nevulo</title>
        <meta
          name="description"
          content="Explore games I'm developing, including Roblox experiences and other game projects."
        />
        <meta property="og:title" content="Games by Nevulo" />
        <meta
          property="og:description"
          content="Explore games I'm developing, including Roblox experiences and other game projects."
        />
        <meta property="og:url" content="https://nev.so/games" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=My%20Games&subtitle=Roblox%20%26%20Game%20Development"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Games by Nevulo" />
        <meta name="twitter:description" content="Explore games I'm developing." />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=My%20Games&subtitle=Roblox%20%26%20Game%20Development"
        />
      </Head>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Background = styled.div`
  width: 100%;
  filter: ${(props) => (props.theme.contrast === "#000" ? "invert(1)" : "")};
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.02) 0%, rgba(59, 130, 246, 0.02) 100%);
  height: 100%;
  z-index: -1;
  position: fixed;
  top: 0;
  left: 0;
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem 3rem;
  }
`;

const GamesGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const GameCard = styled(StrippedLink)`
  display: block;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: ${(props) => props.theme.contrast}08;
  border: 1px solid ${(props) => props.theme.contrast}10;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border-color: ${(props) => props.theme.contrast}20;
  }
`;

const GameImageWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 220px;

  @media (max-width: 768px) {
    height: 180px;
  }
`;

const GameOverlay = styled.div<{ $gradient: string }>`
  position: absolute;
  inset: 0;
  background: ${(props) => props.$gradient};
  opacity: 0.4;
  mix-blend-mode: multiply;
`;

const GameContent = styled.div`
  padding: 1.5rem;
`;

const GameBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const ComingSoonBadge = styled.span<{ $variant?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
  background: ${(props) => (props.$variant === "secret" ? "rgba(168, 85, 247, 0.15)" : "rgba(16, 185, 129, 0.15)")};
  color: ${(props) => (props.$variant === "secret" ? "#a855f7" : "#10b981")};
  border: 1px solid ${(props) => (props.$variant === "secret" ? "rgba(168, 85, 247, 0.3)" : "rgba(16, 185, 129, 0.3)")};
`;

const PlatformBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
  background: ${(props) => props.theme.contrast}08;
  color: ${(props) => props.theme.contrast}80;
  border: 1px solid ${(props) => props.theme.contrast}15;
`;

const GameTitle = styled.h2`
  font-family: var(--font-sans);
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
`;

const GameDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  color: ${(props) => props.theme.contrast}90;
  line-height: 1.6;
  margin: 0 0 1rem 0;
`;

const GameTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const GameTag = styled.span<{ $color: string }>`
  padding: 0.25rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: 12px;
  background: ${(props) => props.$color}15;
  color: ${(props) => props.$color};
`;

const SecretGameCard = styled.div`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 1px dashed ${(props) => props.theme.contrast}20;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SecretContent = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
`;

const SecretIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 2rem;
  font-weight: 700;
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
  border: 2px dashed rgba(168, 85, 247, 0.3);
  border-radius: 16px;
`;

const SecretBadgeRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
`;

const SecretTitle = styled.h2`
  font-family: var(--font-sans);
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
`;

const SecretDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  color: ${(props) => props.theme.contrast}70;
  line-height: 1.6;
  margin: 0;
  max-width: 320px;
`;

const SecretHint = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #a855f7;
  margin: 1rem 0 0 0;
  opacity: 0.8;
`;

const SecretGlow = styled.div`
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;
