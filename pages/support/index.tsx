import { faCheck, faChevronRight, faCrown, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  CheckoutButton,
  SubscriptionDetailsButton,
  usePlans,
  useSubscription,
} from "@clerk/nextjs/experimental";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styled, { css, keyframes } from "styled-components";
import useSWR from "swr";
import type { FounderSpotsResponse } from "../api/founder/spots";
import NevuloLogo from "../../assets/svg/nevulo-huge-bold-svg.svg";
import SuperLegendIcon from "../../assets/img/super-legend.png";
import SuperLegend2Icon from "../../assets/img/super-legend-2.png";
import { BackButton, SectionTitle } from "../../components/generics";
import { AnimatedMinimalView } from "../../components/layout/minimal";
import { PLANS } from "../../lib/clerk";
import { useSupporterStatus } from "../../hooks/useSupporterStatus";

const PLAN_ICONS = {
  [PLANS.SUPER_LEGEND]: SuperLegendIcon,
  [PLANS.SUPER_LEGEND_2]: SuperLegend2Icon,
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Plan feature definitions with descriptions
const PLAN_FEATURES = {
  [PLANS.SUPER_LEGEND]: [
    {
      title: "Instant access to \"Legend Vault\"",
      description: "A collection of resources/downloadables designed to help you",
      isBeta: true
    },
    {
      title: "Discord supporter role & custom channel",
      description: "Get a special role and access to an exclusive supporter channel",
    },
    {
      title: "Early access to new content",
      description: "Be the first to see music, writing, videos, and more",
    },
    {
      title: "Twitch special access",
      description: "VIP status, featured on stream",
    },
    {
      title: "Priority voting",
    },
    {
      title: "Mention in Credits",
      description: "Your name featured on the credits page",
    },
    {
      title: "Premium features in Nevulo software/games",
      description: "Unlock exclusive features across all Nevulo projects",
    },
  ],
  [PLANS.SUPER_LEGEND_2]: [
    {
      title: "Everything in Super Legend I + additional special access",
      isSpecial: true,
    },
    {
      title: "Extra premium features in Nevulo software/games",
      description: "Cosmetics in games, highest access in software (ie. website & Nevi)",
    },
    {
      title: "Monthly digital legend-loot",
      description: "Exclusive digital content curated by me, delivered monthly",
    },
    {
      title: "Special access to courses & new course builder",
      description: "Learn with exclusive educational content and tools",
      isBeta: true,
    },
    {
      title: "Evolving legendary badge",
    },
    {
      title: "Private lounge, on website & Discord",
      description: "Access to all special channels, hang with other legends",
    },
  ],
} as const;

// Plan display names
const PLAN_META: Record<string, { name: string }> = {
  [PLANS.SUPER_LEGEND]: {
    name: "Super Legend",
  },
  [PLANS.SUPER_LEGEND_2]: {
    name: "Super Legend II",
  },
};

function FounderBanner() {
  const { data, error } = useSWR<FounderSpotsResponse>("/api/founder/spots", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  if (!data || error || data.spotsRemaining === 0) {
    return null;
  }

  return (
    <BannerContainer>
      <BannerGlow />
      <BannerContent>
        <TrophyIconWrapper>
          <FontAwesomeIcon icon={faTrophy} />
        </TrophyIconWrapper>
        <BannerText>
          <BannerTitle>LIMITED</BannerTitle>
          <BannerDescription>
            The first 10 supporters get access to a special <FounderHighlight>Founder</FounderHighlight> badge
            with additional content. Subscribe below, only{" "}
            <SpotsCount>{data.spotsRemaining}</SpotsCount>{" "}
            {data.spotsRemaining === 1 ? "spot" : "spots"} left!
          </BannerDescription>
        </BannerText>
      </BannerContent>
    </BannerContainer>
  );
}

interface PlanCardProps {
  planId: string;
  planSlug: string;
  isActive: boolean;
  isOtherPlanActive: boolean;
  monthlyPrice: number | null;
  annualMonthlyPrice: number | null;
  activePlanPeriod: "month" | "annual" | null;
  onSubscriptionChange?: () => void;
}

function PlanCard({ planId, planSlug, isActive, isOtherPlanActive, monthlyPrice, annualMonthlyPrice, activePlanPeriod, onSubscriptionChange }: PlanCardProps) {
  const meta = PLAN_META[planSlug];
  const features = PLAN_FEATURES[planSlug as keyof typeof PLAN_FEATURES];
  const [billedAnnually, setBilledAnnually] = useState(false); // Default to monthly

  if (!meta || !features) return null;

  // Calculate display price from Clerk data
  const hasAnnualOption = annualMonthlyPrice !== null && annualMonthlyPrice > 0;
  const displayPrice = billedAnnually && hasAnnualOption
    ? annualMonthlyPrice // Clerk already calculates the monthly equivalent
    : (monthlyPrice ?? 0);

  // Determine if this exact plan+period combo is active
  const selectedPeriod = billedAnnually ? "annual" : "month";
  const isExactPlanActive = isActive && activePlanPeriod !== null && activePlanPeriod === selectedPeriod;
  const isSwitchingPeriod = isActive && activePlanPeriod !== null && activePlanPeriod !== selectedPeriod;

  const planIcon = PLAN_ICONS[planSlug as keyof typeof PLAN_ICONS];

  return (
    <PricingCard $isActive={isActive}>
      {isActive && <ActiveBadge>Active</ActiveBadge>}

      <PlanHeader>
        {planIcon && (
          <PlanIconWrapper>
            <Image src={planIcon} alt={meta.name} width={28} height={28} />
          </PlanIconWrapper>
        )}
        <PlanName>{meta.name}</PlanName>
      </PlanHeader>

      <PriceRow>
        <PriceAmount>${displayPrice.toFixed(2)}</PriceAmount>
        <PricePeriod>/month</PricePeriod>
      </PriceRow>

      {hasAnnualOption ? (
        <BillingToggle>
          <ToggleSwitch
            $active={billedAnnually}
            onClick={() => setBilledAnnually(!billedAnnually)}
          >
            <ToggleKnob $active={billedAnnually} />
          </ToggleSwitch>
          <BillingLabel>{billedAnnually ? "Billed annually" : "Billed monthly"}</BillingLabel>
        </BillingToggle>
      ) : (
        <BillingLabel>Billed monthly</BillingLabel>
      )}

      <Divider />

      <FeatureList>
        {features.map((feature, index) => (
          <FeatureItem key={index}>
            <FeatureIcon>
              <FontAwesomeIcon icon={faCheck} />
            </FeatureIcon>
            <FeatureContent>
              <FeatureTitleRow>
                <FeatureTitle>{feature.title}</FeatureTitle>
                {"isBeta" in feature && feature.isBeta && <BetaBadge>Beta</BetaBadge>}
              </FeatureTitleRow>
              {'description' in feature && feature.description && <FeatureDescription>{feature.description}</FeatureDescription>}
            </FeatureContent>
          </FeatureItem>
        ))}
      </FeatureList>

      <ButtonContainer>
        <SignedIn>
          {isExactPlanActive ? (
            <SubscriptionDetailsButton>
              <ManageButton>Manage subscription</ManageButton>
            </SubscriptionDetailsButton>
          ) : (
            <CheckoutButton
              planId={planId}
              planPeriod={billedAnnually && hasAnnualOption ? "annual" : "month"}
              newSubscriptionRedirectUrl="/support/thanks"
              onSubscriptionComplete={onSubscriptionChange}
            >
              <SubscribeBtn $isSwitch={isOtherPlanActive || isSwitchingPeriod}>
                {isOtherPlanActive || isSwitchingPeriod ? "Switch to this plan" : "Subscribe"}
              </SubscribeBtn>
            </CheckoutButton>
          )}
        </SignedIn>
        <SignedOut>
          <SignInPromptButton href="/sign-in?redirect_url=/support">
            Sign in to subscribe
          </SignInPromptButton>
        </SignedOut>
      </ButtonContainer>
    </PricingCard>
  );
}

// Helper to extract price from Clerk plan
function getPlanPrices(plan: any): { monthly: number | null; annualMonthly: number | null } {
  if (!plan) return { monthly: null, annualMonthly: null };

  // Clerk plan structure:
  // - fee.amount: monthly price in cents
  // - annualFee.amount: annual price in cents
  // - annualMonthlyFee.amount: monthly equivalent of annual (already calculated by Clerk)
  const monthly = plan.fee?.amount ? plan.fee.amount / 100 : null;
  const annualMonthly = plan.annualMonthlyFee?.amount ? plan.annualMonthlyFee.amount / 100 : null;

  return { monthly, annualMonthly };
}

function CustomPricingTable() {
  const { data: plans, isLoading: plansLoading, revalidate: revalidatePlans } = usePlans();
  const { data: subscription, isLoading: subLoading, revalidate: revalidateSubscription } = useSubscription();

  const isLoading = plansLoading || subLoading;

  // Callback to refresh subscription data after changes
  const handleSubscriptionChange = () => {
    // Revalidate both plans and subscription data
    revalidateSubscription?.();
    revalidatePlans?.();
  };

  // Get active plan slug and period from subscription
  // Clerk nests the plan inside subscriptionItems[0].plan
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = subscription as any;
  const activeItem = subAny?.subscriptionItems?.[0];
  const activePlanSlug = activeItem?.plan?.slug ?? null;
  const activePlanPeriod: "month" | "annual" | null = activeItem?.planPeriod ?? null;

  // Only consider paid plans as "subscribed" - ignore free tier
  const isPaidPlan = activePlanSlug === PLANS.SUPER_LEGEND || activePlanSlug === PLANS.SUPER_LEGEND_2;
  const isSubscribed = subAny?.status === "active" && isPaidPlan;

  // Plans is an array directly, not { data: [...] }
  const plansArray = Array.isArray(plans) ? plans : (plans as any)?.data ?? [];

  // Find plans from the loaded data
  const superLegendPlan = plansArray.find(
    (p: { slug: string; id: string }) => p.slug === PLANS.SUPER_LEGEND
  );
  const superLegend2Plan = plansArray.find(
    (p: { slug: string; id: string }) => p.slug === PLANS.SUPER_LEGEND_2
  );

  // Get prices from Clerk
  const sl1Prices = getPlanPrices(superLegendPlan);
  const sl2Prices = getPlanPrices(superLegend2Plan);

  if (isLoading) {
    return <PricingSkeletons />;
  }

  return (
    <PricingGrid>
      {superLegendPlan && (
        <PlanCard
          planId={superLegendPlan.id}
          planSlug={PLANS.SUPER_LEGEND}
          isActive={isSubscribed && activePlanSlug === PLANS.SUPER_LEGEND}
          isOtherPlanActive={isSubscribed && activePlanSlug !== PLANS.SUPER_LEGEND}
          monthlyPrice={sl1Prices.monthly}
          annualMonthlyPrice={sl1Prices.annualMonthly}
          activePlanPeriod={isSubscribed && activePlanSlug === PLANS.SUPER_LEGEND ? activePlanPeriod : null}
          onSubscriptionChange={handleSubscriptionChange}
        />
      )}
      {superLegend2Plan && (
        <PlanCard
          planId={superLegend2Plan.id}
          planSlug={PLANS.SUPER_LEGEND_2}
          isActive={isSubscribed && activePlanSlug === PLANS.SUPER_LEGEND_2}
          isOtherPlanActive={isSubscribed && activePlanSlug !== PLANS.SUPER_LEGEND_2}
          monthlyPrice={sl2Prices.monthly}
          annualMonthlyPrice={sl2Prices.annualMonthly}
          activePlanPeriod={isSubscribed && activePlanSlug === PLANS.SUPER_LEGEND_2 ? activePlanPeriod : null}
          onSubscriptionChange={handleSubscriptionChange}
        />
      )}
    </PricingGrid>
  );
}

function SubscriberBenefits() {
  const { status, isLoading } = useSupporterStatus();
  const { data: subscription, isLoading: subLoading } = useSubscription();

  // Get active plan from subscription
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = subscription as any;
  const activeItem = subAny?.subscriptionItems?.[0];
  const activePlanSlug = activeItem?.plan?.slug ?? null;
  const isPaidPlan = activePlanSlug === PLANS.SUPER_LEGEND || activePlanSlug === PLANS.SUPER_LEGEND_2;
  const isSubscribed = subAny?.status === "active" && isPaidPlan;

  // Only show if user is subscribed
  if (subLoading || !isSubscribed) return null;

  const isFounder = status?.founderNumber !== undefined && status?.founderNumber !== null;

  return (
    <BenefitsSection>
      <SectionTitle $centered>Your Benefits</SectionTitle>

      {/* Founder Badge Status - only shown to founders */}
      {!isLoading && isFounder && (
        <FounderStatusCard>
          <FounderStatusIcon>
            <FontAwesomeIcon icon={faCrown} />
          </FounderStatusIcon>
          <FounderStatusContent>
            <FounderStatusTitle>Founder #{status.founderNumber}</FounderStatusTitle>
            <FounderStatusDescription>
              You&apos;re an early supporter and have special access to a badge + Discord role!
            </FounderStatusDescription>
          </FounderStatusContent>
        </FounderStatusCard>
      )}

      {/* Link to /supporter for full benefits */}
      <ViewBenefitsCard href="/supporter">
        <ViewBenefitsContent>
          <ViewBenefitsTitle>View all your perks</ViewBenefitsTitle>
          <ViewBenefitsDescription>
            See your full list of benefits including software perks, content access, badges, and more.
          </ViewBenefitsDescription>
        </ViewBenefitsContent>
        <ViewBenefitsArrow>
          <FontAwesomeIcon icon={faChevronRight} />
        </ViewBenefitsArrow>
      </ViewBenefitsCard>
    </BenefitsSection>
  );
}

function PricingSkeletons() {
  return (
    <PricingGrid>
      <SkeletonCard>
        <SkeletonTitle />
        <SkeletonPrice />
        <SkeletonBilling />
        <SkeletonDivider />
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
        <SkeletonDivider />
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
    </PricingGrid>
  );
}

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

        <FounderBanner />

        <PricingContainer>
          <CustomPricingTable />
        </PricingContainer>

        <SignedIn>
          <SubscriberBenefits />
        </SignedIn>

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
              <AltSubscribeButton
                href="https://www.twitch.tv/subs/nevvulo"
                target="_blank"
                rel="noopener noreferrer"
                $color="#9146FF"
              >
                Subscribe on Twitch
              </AltSubscribeButton>
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
              <AltSubscribeButton
                href="https://discord.com/channels/363516708062756886/boosts"
                target="_blank"
                rel="noopener noreferrer"
                $color="#5865F2"
              >
                Boost the Server
              </AltSubscribeButton>
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

// ============================================
// STYLED COMPONENTS
// ============================================

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

// Founder Banner Styles
const founderGlow = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`;

const BannerContainer = styled.div`
  position: relative;
  margin-bottom: 1.25rem;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 110, 180, 0.06);
  border: 1px solid rgba(255, 110, 180, 0.2);
  border-radius: 8px;
  overflow: hidden;
`;

const BannerGlow = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 110, 180, 0.05) 0%,
    rgba(255, 110, 180, 0.02) 50%,
    rgba(255, 110, 180, 0.05) 100%
  );
  animation: ${founderGlow} 3s ease-in-out infinite;
  pointer-events: none;
`;

const BannerContent = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1;

  @media (max-width: 600px) {
    flex-direction: row;
    text-align: left;
  }
`;

const TrophyIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 110, 180, 0.12);
  border-radius: 6px;
  color: #ff6eb4;
  font-size: 14px;
  flex-shrink: 0;
`;

const BannerText = styled.div`
  flex: 1;
`;

const BannerTitle = styled.span`
  display: inline;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 10px;
  color: #ff6eb4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 8px;
  padding: 2px 6px;
  background: rgba(255, 110, 180, 0.15);
  border-radius: 3px;
`;

const BannerDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.4;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  opacity: 0.9;
`;

const FounderHighlight = styled.span`
  font-weight: 600;
  color: #ff6eb4;
`;

const SpotsCount = styled.span`
  font-weight: 600;
  color: #ff6eb4;
  font-size: 13px;
`;

// Pricing Container
const PricingContainer = styled.div`
  margin-bottom: 4rem;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

// Pricing Card Styles
const PricingCard = styled.div<{ $isActive?: boolean }>`
  position: relative;
  background: rgba(30, 30, 40, 0.6);
  border: 1.5px solid rgba(79, 77, 193, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;

  ${(p) =>
    p.$isActive &&
    css`
      border-color: rgba(79, 77, 193, 0.6);
      box-shadow: 0 0 20px rgba(79, 77, 193, 0.2);
    `}

  &:hover {
    border-color: rgba(79, 77, 193, 0.5);
  }
`;

const ActiveBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(79, 77, 193, 0.3);
  color: #a5a3e8;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(79, 77, 193, 0.5);
`;

const PlanHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.75rem;
`;

const PlanIconWrapper = styled.div`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
`;

const PlanName = styled.h3`
  font-family: var(--font-mono);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.32px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 0.5rem;
`;

const PriceAmount = styled.span`
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
`;

const PricePeriod = styled.span`
  font-family: var(--font-sans);
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

const BillingToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
`;

const ToggleSwitch = styled.button<{ $active: boolean }>`
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: ${(p) => (p.$active ? "#4f4dc1" : "rgba(255, 255, 255, 0.2)")};
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
  padding: 0;
`;

const ToggleKnob = styled.div<{ $active: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: ${(p) => (p.$active ? "20px" : "2px")};
  transition: left 0.2s ease;
`;

const BillingLabel = styled.span`
  font-family: var(--font-sans);
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 1rem 0;
`;

const FeatureList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
`;

const FeatureItem = styled.li`
  display: flex;
  gap: 12px;
`;

const FeatureIcon = styled.span`
  color: ${(props) => props.theme.textColor};
  font-size: 12px;
  margin-top: 3px;
  opacity: 0.8;
`;

const FeatureContent = styled.div`
  flex: 1;
`;

const FeatureTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
`;

const BetaBadge = styled.span`
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.15);
  border: 1px solid rgba(167, 139, 250, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
`;

const FeatureTitle = styled.span`
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
`;

const FeatureDescription = styled.div`
  font-family: var(--font-sans);
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  line-height: 1.4;
`;

const ButtonContainer = styled.div`
  margin-top: 1.5rem;
`;

const buttonStyles = css`
  display: block;
  width: 100%;
  text-align: center;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const SubscribeBtn = styled.button<{ $isSwitch?: boolean }>`
  ${buttonStyles}
  background: linear-gradient(135deg, #4f4dc1, #6b69d6);
  color: white;
  border: none;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 77, 193, 0.4);
  }
`;

const ManageButton = styled.button`
  ${buttonStyles}
  background: transparent;
  color: ${(props) => props.theme.textColor};
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const SignInPromptButton = styled.a`
  ${buttonStyles}
  background: rgba(79, 77, 193, 0.2);
  color: #a5a3e8;
  border: 1px solid rgba(79, 77, 193, 0.3);

  &:hover {
    background: rgba(79, 77, 193, 0.3);
    border-color: rgba(79, 77, 193, 0.5);
  }
`;

// Skeleton Styles
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
  min-height: 500px;
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

const SkeletonDivider = styled(SkeletonBase)`
  width: 100%;
  height: 1px;
  margin: 0.5rem 0;
`;

const SkeletonFeatures = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
  flex: 1;
`;

const SkeletonFeature = styled(SkeletonBase)`
  height: 40px;
`;

const SkeletonButton = styled(SkeletonBase)`
  width: 100%;
  height: 44px;
  border-radius: 8px;
  margin-top: auto;
`;

// Alternative Support Section
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
  color: #5865f2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const AltSubscribeButton = styled.a<{ $color: string }>`
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

// Subscriber Benefits Section
const BenefitsSection = styled.div`
  margin-top: 3rem;
  padding-top: 3rem;
  border-top: 1px solid rgba(79, 77, 193, 0.2);
`;

// View Benefits Card - links to /supporter
const ViewBenefitsCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(79, 77, 193, 0.08);
  border: 1px solid rgba(79, 77, 193, 0.25);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(79, 77, 193, 0.12);
    border-color: rgba(79, 77, 193, 0.4);
    transform: translateX(4px);
  }
`;

const ViewBenefitsContent = styled.div`
  flex: 1;
`;

const ViewBenefitsTitle = styled.h4`
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 16px;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.25rem 0;
`;

const ViewBenefitsDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.4;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  opacity: 0.7;
`;

const ViewBenefitsArrow = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 77, 193, 0.2);
  color: #a5a3e8;
  border-radius: 8px;
  font-size: 14px;
  flex-shrink: 0;
`;

// Founder Status Card
const founderPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 110, 180, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 110, 180, 0);
  }
`;

const FounderStatusCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(255, 110, 180, 0.08) 0%, rgba(255, 110, 180, 0.03) 100%);
  border: 1px solid rgba(255, 110, 180, 0.25);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  animation: ${founderPulse} 3s ease-in-out infinite;
`;

const FounderStatusIcon = styled.div`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 110, 180, 0.15);
  color: #ff6eb4;
  border-radius: 10px;
  font-size: 18px;
  flex-shrink: 0;
`;

const FounderStatusContent = styled.div`
  flex: 1;
`;

const FounderStatusTitle = styled.h4`
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 18px;
  color: #ff6eb4;
  margin: 0 0 0.25rem 0;
`;

const FounderStatusDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.4;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  opacity: 0.85;
`;
