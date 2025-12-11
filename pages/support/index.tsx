import { PricingTable } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";
import NevuloLogo from "../../assets/svg/nevulo-huge-bold-svg.svg";
import { BackButton } from "../../components/generics";
import { AnimatedMinimalView } from "../../components/layout/minimal";

export default function Support() {
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
                <Image
                  src={NevuloLogo}
                  alt="Nevulo Logo"
                  width={48}
                  height={48}
                />
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

        <PricingContainer>
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
        </PricingContainer>

        <AlternativeSupport>
          <AlternativeTitle>Other Ways to Support</AlternativeTitle>
          <SupportGrid>
            {/* Twitch Subscriptions */}
            <SupportCategory>
              <CategoryHeader $color="#9146FF">
                <TwitchIcon viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </TwitchIcon>
                <CategoryTitle>Twitch Subscriptions</CategoryTitle>
              </CategoryHeader>
              <TierGrid>
                <TierCard $tier={1}>
                  <TierBadge $tier={1}>Tier 1</TierBadge>
                  <TierPrice>$4.99<span>/mo</span></TierPrice>
                  <TierPerks>
                    <li>Ad-free viewing</li>
                    <li>Sub emotes</li>
                    <li>Chat badge</li>
                  </TierPerks>
                </TierCard>
                <TierCard $tier={2}>
                  <TierBadge $tier={2}>Tier 2</TierBadge>
                  <TierPrice>$9.99<span>/mo</span></TierPrice>
                  <TierPerks>
                    <li>All Tier 1 perks</li>
                    <li>Extra emotes</li>
                    <li>Priority support</li>
                  </TierPerks>
                </TierCard>
                <TierCard $tier={3}>
                  <TierBadge $tier={3}>Tier 3</TierBadge>
                  <TierPrice>$24.99<span>/mo</span></TierPrice>
                  <TierPerks>
                    <li>All Tier 2 perks</li>
                    <li>Exclusive emotes</li>
                    <li>Special recognition</li>
                  </TierPerks>
                </TierCard>
              </TierGrid>
              <SubscribeButton
                href="https://www.twitch.tv/subs/nevulo"
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
                <CategoryTitle>Discord Server Boosting</CategoryTitle>
              </CategoryHeader>
              <BoostCard>
                <BoostIcon>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.001 2L3 7.5v9L12.001 22 21 16.5v-9L12.001 2zm0 2.311l6.474 4.08-2.544 1.604-3.93-2.476-3.93 2.476-2.544-1.604L12 4.311zM5.5 15.222V9.29l5.5 3.466v5.933l-5.5-3.466zm7 3.466v-5.933l5.5-3.466v5.933l-5.5 3.466z" />
                  </svg>
                </BoostIcon>
                <BoostTitle>Server Boost</BoostTitle>
                <BoostDescription>
                  Help unlock perks for the entire community! Boosting gives everyone
                  better audio quality, more emoji slots, and server customization.
                </BoostDescription>
                <BoostPerks>
                  <li>Support the community</li>
                  <li>Exclusive booster role</li>
                  <li>Booster badge in chat</li>
                  <li>Early access to features</li>
                </BoostPerks>
              </BoostCard>
              <SubscribeButton
                href="https://discord.com/servers/nevulo"
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
        <meta property="og:url" content="https://nevulo.xyz/support" />
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
  font-family: "Sixtyfour", monospace;
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
  font-family: "Fira Code", monospace;
  font-size: 15px;
  line-height: 1.8;
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

  /* Override Clerk's default styling to match site theme */
  .cl-pricingTable {
    --clerk-background: transparent;
  }
`;

const AlternativeSupport = styled.div`
  margin-top: 3rem;
  padding-top: 3rem;
  border-top: 1px solid rgba(79, 77, 193, 0.2);
`;

const AlternativeTitle = styled.h3`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 24px;
  color: ${(props) => props.theme.contrast};
  text-align: center;
  margin-bottom: 2rem;
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
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 18px;
  margin: 0;
  color: ${(props) => props.theme.contrast};
`;

const TierGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  margin-bottom: 1.5rem;
`;

const getTierColor = (tier: number) => {
  switch (tier) {
    case 1:
      return "#9146FF";
    case 2:
      return "#00C8FF";
    case 3:
      return "#FFD700";
    default:
      return "#9146FF";
  }
};

const TierCard = styled.div<{ $tier: number }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid ${(props) => getTierColor(props.$tier)}33;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => getTierColor(props.$tier)}66;
    background: rgba(0, 0, 0, 0.3);
  }
`;

const TierBadge = styled.span<{ $tier: number }>`
  font-family: "Inter", sans-serif;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: ${(props) => getTierColor(props.$tier)}22;
  color: ${(props) => getTierColor(props.$tier)};
  white-space: nowrap;
`;

const TierPrice = styled.div`
  font-family: "Inter", sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: ${(props) => props.theme.contrast};
  white-space: nowrap;

  span {
    font-weight: 400;
    font-size: 12px;
    opacity: 0.6;
  }
`;

const TierPerks = styled.ul`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    font-family: "Inter", sans-serif;
    font-size: 12px;
    color: ${(props) => props.theme.textColor};
    opacity: 0.8;

    &::before {
      content: "•";
      margin-right: 0.35rem;
      opacity: 0.5;
    }
  }
`;

const BoostCard = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem 1rem;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.1), rgba(255, 115, 250, 0.1));
  border: 1px solid rgba(88, 101, 242, 0.3);
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const BoostIcon = styled.div`
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  color: #ff73fa;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const BoostTitle = styled.h5`
  font-family: "Inter", sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
`;

const BoostDescription = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: ${(props) => props.theme.textColor};
  opacity: 0.8;
  margin: 0 0 1rem 0;
`;

const BoostPerks = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  li {
    font-family: "Inter", sans-serif;
    font-size: 13px;
    color: ${(props) => props.theme.textColor};

    &::before {
      content: "✓";
      margin-right: 0.5rem;
      color: #ff73fa;
    }
  }
`;

const SubscribeButton = styled.a<{ $color: string }>`
  display: block;
  text-align: center;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  padding: 0.875rem 1.5rem;
  background: ${(props) => props.$color};
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-top: auto;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${(props) => props.$color}44;
  }
`;
