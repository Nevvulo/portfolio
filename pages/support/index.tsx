import { PricingTable } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import NevuloLogo from "../../assets/svg/nevulo-huge-bold-svg.svg";
import { BackButton, SectionTitle } from "../../components/generics";
import { AnimatedMinimalView } from "../../components/layout/minimal";

function PricingSkeletons() {
  return (
    <SkeletonContainer>
      <SkeletonCard>
        <SkeletonTitle />
        <SkeletonPrice />
        <SkeletonBilling />
        <SkeletonFeatures>
          <SkeletonFeature style={{ width: "85%" }} />
          <SkeletonFeature style={{ width: "95%" }} />
          <SkeletonFeature style={{ width: "60%" }} />
          <SkeletonFeature style={{ width: "50%" }} />
          <SkeletonFeature style={{ width: "70%" }} />
          <SkeletonFeature style={{ width: "75%" }} />
        </SkeletonFeatures>
        <SkeletonButton />
      </SkeletonCard>
      <SkeletonCard>
        <SkeletonActiveBadge />
        <SkeletonTitle />
        <SkeletonPrice />
        <SkeletonBilling />
        <SkeletonFeatures>
          <SkeletonFeature style={{ width: "70%" }} />
          <SkeletonFeature style={{ width: "85%" }} />
          <SkeletonFeature style={{ width: "75%" }} />
          <SkeletonFeature style={{ width: "80%" }} />
          <SkeletonFeature style={{ width: "60%" }} />
          <SkeletonFeature style={{ width: "85%" }} />
        </SkeletonFeatures>
        <SkeletonButton />
      </SkeletonCard>
    </SkeletonContainer>
  );
}

export default function Support() {
  const [isLoaded, setIsLoaded] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Watch for Clerk's pricing table cards to render
    const checkForContent = () => {
      if (pricingRef.current) {
        // Look for actual pricing card content (buttons, prices, etc)
        const clerkCards = pricingRef.current.querySelectorAll(
          '[class*="cl-pricingTable"] button, [class*="cl-card"]',
        );
        if (clerkCards.length > 0) {
          setIsLoaded(true);
          return true;
        }
      }
      return false;
    };

    // Check immediately
    if (checkForContent()) return;

    const observer = new MutationObserver(() => {
      if (checkForContent()) {
        observer.disconnect();
      }
    });

    if (pricingRef.current) {
      observer.observe(pricingRef.current, { childList: true, subtree: true });
    }

    // Fallback timeout
    const timeout = setTimeout(() => setIsLoaded(true), 5000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <SupportView>
      <BackButtonWrapper>
        <BackButton href="/" />
      </BackButtonWrapper>

      <ContentContainer>
        <IntroSection>
          <IntroTitle>
            <span>support</span>
            <NevuloGroup>
              <LogoWrapper>
                <Image src={NevuloLogo} alt="Nevulo Logo" width={48} height={48} />
              </LogoWrapper>
              nevulo
            </NevuloGroup>
          </IntroTitle>
          <IntroDescription>
            If you enjoy my content and want to support what I do,
            <br />
            consider becoming a <SuperLegend>Super Legend!</SuperLegend>
            <br />
            Your support helps me create more awesome content 💖
          </IntroDescription>
        </IntroSection>

        <PricingContainer ref={pricingRef}>
          <SkeletonWrapper $isLoaded={isLoaded}>
            <PricingSkeletons />
          </SkeletonWrapper>
          <PricingTableWrapper $isLoaded={isLoaded}>
            <PricingTable
              appearance={{
                variables: {
                  colorPrimary: "#4f4dc1",
                  colorBackground: "transparent",
                  colorText: "#fff",
                  colorTextSecondary: "#bdbdbd",
                  borderRadius: "12px",
                },
                elements: {
                  pricingTableRoot: {
                    maxWidth: "100%",
                  },
                  card: {
                    backgroundColor: "rgba(30, 30, 40, 0.6)",
                    border: "1.5px solid rgba(79, 77, 193, 0.3)",
                    backdropFilter: "blur(10px)",
                  },
                  button: {
                    background: "linear-gradient(135deg, #4f4dc1, #6b69d6)",
                    border: "none",
                  },
                },
              }}
            />
          </PricingTableWrapper>
        </PricingContainer>

        <AlternativeSupport>
          <SectionTitle $centered>Other Ways to Support</SectionTitle>
          <SupportGrid>
            {/* Twitch Subscriptions */}
            <SupportCategory>
              <CategoryHeader $color="#9146FF">
                <TwitchIcon viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </TwitchIcon>
                <CategoryTitle>Twitch</CategoryTitle>
              </CategoryHeader>
              <SimpleDescription>
                Subscribe on Twitch to get ad-free viewing, subscriber emotes, and a chat badge.
                Prices vary by region.
              </SimpleDescription>
              <SubscribeButton
                href="https://www.twitch.tv/subs/nevvulo"
                target="_blank"
                rel="noopener noreferrer"
                $color="#9146FF"
              >
                Subscribe on Twitch
              </SubscribeButton>
            </SupportCategory>

            {/* Discord Server Boosting */}
            <SupportCategory>
              <CategoryHeader $color="#5865F2">
                <DiscordIcon viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </DiscordIcon>
                <CategoryTitle>Discord</CategoryTitle>
              </CategoryHeader>
              <SimpleDescription>
                Server boosts benefit everybody on the Discord server with perks!{" "}
                <LearnMoreLink
                  href="https://support.discord.com/hc/en-us/articles/360028038352-Server-Boosting"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about Server Boosting here.
                </LearnMoreLink>
              </SimpleDescription>
              <SubscribeButton
                href="https://discord.com/channels/363516708062756886/boosts"
                target="_blank"
                rel="noopener noreferrer"
                $color="#5865F2"
              >
                Boost the Server
              </SubscribeButton>
            </SupportCategory>
          </SupportGrid>
        </AlternativeSupport>
      </ContentContainer>

      <Head>
        <title>Support - Nevulo</title>
        <meta
          name="description"
          content="Support my work and become a Super Legend! Help me create more content and open source projects."
        />
        <meta property="og:title" content="Support Nevulo" />
        <meta
          property="og:description"
          content="Support my work and become a Super Legend! Help me create more content and open source projects."
        />
        <meta property="og:url" content="https://nev.so/support" />
      </Head>
    </SupportView>
  );
}

const SupportView = styled(AnimatedMinimalView)`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 4rem;
`;

const BackButtonWrapper = styled.div`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
`;

const ContentContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
  width: 100%;

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

const IntroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const IntroTitle = styled.h1`
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(32px, 5vw, 48px);
  color: ${(props) => props.theme.contrast};
  margin: 0 0 1rem 0;
  letter-spacing: -1px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 500px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const NevuloGroup = styled.span`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LogoWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
`;

const IntroDescription = styled.p`
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1.8;
  letter-spacing: -0.02em;
  color: ${(props) => props.theme.textColor};
  max-width: 600px;
  margin: 0 auto;
  opacity: 0.9;
`;

const SuperLegend = styled.span`
  font-weight: 700;
  font-size: 18px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PricingContainer = styled.div`
  margin-bottom: 4rem;
  position: relative;
  min-height: 420px;

  /* Override Clerk's default styling to match site theme */
  .cl-pricingTable {
    --clerk-background: transparent;
  }
`;

const SkeletonWrapper = styled.div<{ $isLoaded: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  opacity: ${(props) => (props.$isLoaded ? 0 : 1)};
  pointer-events: ${(props) => (props.$isLoaded ? "none" : "auto")};
  transition: opacity 0.2s ease;
`;

const PricingTableWrapper = styled.div<{ $isLoaded: boolean }>`
  opacity: ${(props) => (props.$isLoaded ? 1 : 0)};
  transition: opacity 0.2s ease;
`;

// Skeleton styles
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    rgba(79, 77, 193, 0.1) 25%,
    rgba(79, 77, 193, 0.2) 50%,
    rgba(79, 77, 193, 0.1) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 4px;
`;

const SkeletonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const SkeletonCard = styled.div`
  position: relative;
  background: rgba(30, 30, 40, 0.6);
  border: 1.5px solid rgba(79, 77, 193, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 380px;
`;

const SkeletonActiveBadge = styled(SkeletonBase)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 50px;
  height: 24px;
  border-radius: 6px;
`;

const SkeletonTitle = styled(SkeletonBase)`
  width: 140px;
  height: 24px;
`;

const SkeletonPrice = styled(SkeletonBase)`
  width: 100px;
  height: 36px;
  margin-top: 0.25rem;
`;

const SkeletonBilling = styled(SkeletonBase)`
  width: 120px;
  height: 14px;
`;

const SkeletonFeatures = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  flex: 1;
`;

const SkeletonFeature = styled(SkeletonBase)`
  height: 18px;
`;

const SkeletonButton = styled(SkeletonBase)`
  width: 100%;
  height: 44px;
  border-radius: 8px;
  margin-top: auto;
`;

const AlternativeSupport = styled.div`
  margin-top: 3rem;
  padding-top: 3rem;
  border-top: 1px solid rgba(79, 77, 193, 0.2);
`;

const SupportGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SupportCategory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(79, 77, 193, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(79, 77, 193, 0.4);
    box-shadow: 0 4px 20px rgba(79, 77, 193, 0.15);
  }
`;

const CategoryHeader = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${(props) => props.$color};
`;

const TwitchIcon = styled.svg`
  width: 28px;
  height: 28px;
`;

const DiscordIcon = styled.svg`
  width: 28px;
  height: 28px;
`;

const CategoryTitle = styled.h4`
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 18px;
  margin: 0;
  color: ${(props) => props.theme.contrast};
`;

const SimpleDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  flex: 1;
`;

const LearnMoreLink = styled.a`
  color: #5865F2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const SubscribeButton = styled.a<{ $color: string }>`
  display: block;
  text-align: center;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  padding: 0.875rem 1.5rem;
  background: ${(props) => props.$color};
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${(props) => props.$color}44;
  }
`;
