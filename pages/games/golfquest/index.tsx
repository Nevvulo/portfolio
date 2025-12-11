import Head from "next/head";
import styled from "styled-components";
import { PostHeader } from "../../../components/blog/post-header";
import { Container } from "../../../components/container";
import { Title } from "../../../components/generics";
import { SimpleNavbar } from "../../../components/navbar/simple";

const Golfquest: React.FC = () => {
  return (
    <>
      <SimpleNavbar title="Golfquest" backRoute="/games" />
      <Container direction="column" style={{ marginTop: "2rem" }}>
        <PostHeader>
          <Title fontSize="48px">Golfquest</Title>
          <BadgeContainer>
            <GameBadge $color="#00A2FF">Roblox</GameBadge>
            <GameBadge $color="#4ade80">Golf</GameBadge>
            <GameBadge $color="#f59e0b">Adventure</GameBadge>
            <GameBadge $color="#8b5cf6">Multiplayer</GameBadge>
          </BadgeContainer>
        </PostHeader>


        <ContentContainer>
          <Section>
            <SectionTitle>About Golfquest</SectionTitle>
            <Description>
              Golfquest is an exciting golf adventure game built on Roblox. Combining the precision
              of golf with the thrill of exploration and adventure, players embark on a journey
              through beautifully crafted courses filled with challenges, surprises, and hidden
              secrets.
            </Description>
          </Section>

          <Section>
            <SectionTitle>Features</SectionTitle>
            <FeatureList>
              <Feature>
                <FeatureIcon>⛳</FeatureIcon>
                <FeatureContent>
                  <FeatureTitle>Unique Golf Mechanics</FeatureTitle>
                  <FeatureDescription>
                    Refined physics and controls for an authentic golf experience
                  </FeatureDescription>
                </FeatureContent>
              </Feature>
              <Feature>
                <FeatureIcon>🗺️</FeatureIcon>
                <FeatureContent>
                  <FeatureTitle>Adventure Mode</FeatureTitle>
                  <FeatureDescription>
                    Explore diverse environments and complete challenges
                  </FeatureDescription>
                </FeatureContent>
              </Feature>
              <Feature>
                <FeatureIcon>👥</FeatureIcon>
                <FeatureContent>
                  <FeatureTitle>Multiplayer</FeatureTitle>
                  <FeatureDescription>
                    Play with friends and compete on leaderboards
                  </FeatureDescription>
                </FeatureContent>
              </Feature>
              <Feature>
                <FeatureIcon>🎨</FeatureIcon>
                <FeatureContent>
                  <FeatureTitle>Customization</FeatureTitle>
                  <FeatureDescription>
                    Unlock cosmetics, clubs, and personalize your player
                  </FeatureDescription>
                </FeatureContent>
              </Feature>
            </FeatureList>
          </Section>

          <Section>
            <SectionTitle>Development</SectionTitle>
            <Description>
              Golfquest is currently in active development. I'm working on creating an immersive
              experience that combines the relaxing nature of golf with exciting gameplay mechanics
              and a vibrant world to explore.
            </Description>
            <Description>
              Follow development updates on my{" "}
              <StyledLink href="/blog">blog</StyledLink> and{" "}
              <StyledLink href="https://twitter.com/nevvulo" target="_blank" rel="noopener noreferrer">
                Twitter
              </StyledLink>
              !
            </Description>
          </Section>

          <CTASection>
            <CTATitle>Stay Updated</CTATitle>
            <CTADescription>
              Want to be notified when Golfquest launches? Join the Discord community!
            </CTADescription>
            <CTAButton href="/contact">Get in Touch</CTAButton>
          </CTASection>
        </ContentContainer>
      </Container>

      <Head>
        <title>Golfquest - Roblox Golf Adventure Game</title>
        <meta
          name="description"
          content="Golfquest is an exciting golf adventure game on Roblox. Explore unique courses, master golf mechanics, and compete with friends!"
        />
        <meta property="og:title" content="Golfquest - Roblox Golf Adventure" />
        <meta
          property="og:description"
          content="An exciting golf adventure game on Roblox combining precision golf with exploration and multiplayer fun."
        />
        <meta property="og:type" content="website" />
      </Head>
    </>
  );
};

export const GolfquestPreview = () => {
  return (
    <PreviewContainer>
      <PreviewImageWrapper>
    
      </PreviewImageWrapper>
      <PreviewContent>
        <PreviewTitle>Golfquest</PreviewTitle>
        <PreviewDescription>
          A golf adventure game on Roblox. Explore unique courses, master golf mechanics, and
          compete with friends in this exciting multiplayer experience.
        </PreviewDescription>
        <PreviewTags>
          <PreviewTag>Roblox</PreviewTag>
          <PreviewTag>Golf</PreviewTag>
          <PreviewTag>Adventure</PreviewTag>
          <PreviewTag>Multiplayer</PreviewTag>
        </PreviewTags>
      </PreviewContent>
    </PreviewContainer>
  );
};

// Styled Components
const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const GameBadge = styled.span<{ $color: string }>`
  background: ${(props) => props.$color}22;
  border: 1.5px solid ${(props) => props.$color};
  color: ${(props) => props.$color};
  padding: 6px 14px;
  border-radius: 20px;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px ${(props) => props.$color}33;
`;

const ContentContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem 4rem 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem 3rem 1rem;
  }
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-family: "Inter", sans-serif;
  font-weight: 700;
  font-size: 28px;
  color: ${(props) => props.theme.contrast};
  margin-bottom: 1rem;
`;

const Description = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: ${(props) => props.theme.textColor};
  margin-bottom: 1rem;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Feature = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const FeatureIcon = styled.div`
  font-size: 32px;
  flex-shrink: 0;
`;

const FeatureContent = styled.div`
  flex: 1;
`;

const FeatureTitle = styled.h3`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.25rem 0;
`;

const FeatureDescription = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  opacity: 0.8;
`;

const StyledLink = styled.a`
  color: #00a2ff;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const CTASection = styled.div`
  background: ${(props) => props.theme.postBackground};
  border: 2px solid rgba(0, 162, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-top: 4rem;
`;

const CTATitle = styled.h3`
  font-family: "Inter", sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
`;

const CTADescription = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 16px;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 1.5rem 0;
`;

const CTAButton = styled.a`
  display: inline-block;
  background: linear-gradient(135deg, #00a2ff, #00d4ff);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 162, 255, 0.4);
  }
`;

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const PreviewImageWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    height: 200px;
  }
`;

const PreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  flex: 1;
`;

const PreviewTitle = styled.h3`
  font-family: "Inter", sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: ${(props) => props.theme.contrast};
  margin: 0;
`;

const PreviewDescription = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: ${(props) => props.theme.textColor};
  margin: 0;
`;

const PreviewTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PreviewTag = styled.span`
  background: rgba(0, 162, 255, 0.15);
  border: 1px solid rgba(0, 162, 255, 0.3);
  color: #00a2ff;
  padding: 4px 12px;
  border-radius: 16px;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export default Golfquest;
