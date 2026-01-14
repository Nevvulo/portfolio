import { useUser } from "@clerk/nextjs";
import { BookOpen, Check, ChevronRight, Clock, Lock, MessageSquare, Sparkles, Target } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";
import styled from "styled-components";
import { SupporterBadge } from "../../components/badges/supporter-badge";
import { BackButton } from "../../components/generics";
import { AnimatedMinimalView } from "../../components/layout/minimal";
import { BadgeType } from "../../constants/badges";
import { useSupporterStatus } from "../../hooks/useSupporterStatus";

// Feature categories and their features
const BENEFIT_CATEGORIES = [
  {
    id: "lounge",
    title: "Lounge Access",
    icon: MessageSquare,
    description: "Exclusive chat rooms and community spaces",
    features: [
      {
        id: "vip-channels",
        title: "VIP Chat Channels",
        description: "Access to exclusive tier-gated channels in the lounge",
        minTier: "tier1" as const,
        link: "/lounge",
      },
      {
        id: "tier2-lounge",
        title: "Super VIP Lounge",
        description: "Ultra-exclusive channel for Super Legend II members",
        minTier: "tier2" as const,
        link: "/lounge",
      },
      {
        id: "jungle",
        title: "The Jungle",
        description: "Shared listening room to enjoy music together",
        minTier: "free" as const,
        link: "/lounge/jungle",
      },
    ],
  },
  {
    id: "content",
    title: "Content Access",
    icon: BookOpen,
    description: "Exclusive articles, videos, and early access",
    features: [
      {
        id: "early-access",
        title: "Early Access Content",
        description: "Get access to articles and videos before public release",
        minTier: "tier1" as const,
        link: "/learn",
      },
      {
        id: "exclusive-posts",
        title: "Exclusive Posts",
        description: "Members-only articles, tutorials, and behind-the-scenes",
        minTier: "tier1" as const,
        link: "/learn",
      },
      {
        id: "tier2-content",
        title: "Super Legend II Exclusives",
        description: "Premium content only for our most dedicated supporters",
        minTier: "tier2" as const,
        link: "/learn",
      },
    ],
  },
  {
    id: "cosmetics",
    title: "Badges & Cosmetics",
    icon: Sparkles,
    description: "Stand out with exclusive badges and profile customization",
    features: [
      {
        id: "supporter-badge",
        title: "Supporter Badge",
        description: "Show off your support with a special badge on your profile",
        minTier: "tier1" as const,
        badgeType: BadgeType.SUPER_LEGEND,
        badgeLink: "/support",
      },
      {
        id: "tier2-badge",
        title: "Super Legend II Badge",
        description: "Prestigious golden badge for Super Legend II members",
        minTier: "tier2" as const,
        badgeType: BadgeType.SUPER_LEGEND_2,
        badgeLink: "/support",
      },
      {
        id: "twitch-badge",
        title: "Twitch Sub Badge",
        description: "Purple badge showing your Twitch subscription tier",
        special: "twitch" as const,
        badgeType: BadgeType.TWITCH_SUB_T1,
        badgeLink: "https://www.twitch.tv/subs/nevvulo",
      },
      {
        id: "discord-boost-badge",
        title: "Discord Booster Badge",
        description: "Pink badge for Discord server boosters",
        special: "discordBooster" as const,
        badgeType: BadgeType.DISCORD_BOOSTER,
        badgeLink: "https://discord.com/channels/363516708062756886/boosts",
      },
      {
        id: "credits-page",
        title: "Credits Page Recognition",
        description: "Get featured on the /credits page (opt-in)",
        minTier: "tier1" as const,
        link: "/credits",
      },
    ],
  },
  {
    id: "interaction",
    title: "Direct Interaction",
    icon: Target,
    description: "Get closer with priority access and exclusive interactions",
    features: [
      {
        id: "priority-support",
        title: "Priority Support",
        description: "Get faster responses to questions and feedback",
        minTier: "tier1" as const,
      },
      {
        id: "monthly-drops",
        title: "Monthly Mystery Drops",
        description: "Exclusive mystery boxes with wallpapers, discount codes, and more",
        minTier: "tier1" as const,
        comingSoon: true,
      },
      {
        id: "giveaways",
        title: "Exclusive Giveaways",
        description: "Entry into supporter-only giveaways and contests",
        minTier: "tier1" as const,
      },
    ],
  },
];

function getTierLevel(tier: string): number {
  if (tier === "tier2") return 2;
  if (tier === "tier1") return 1;
  return 0;
}

export default function SupporterBenefits() {
  const { isSignedIn } = useUser();
  const { status, isLoading } = useSupporterStatus();

  // Compute user's effective tier
  const userTier = useMemo(() => {
    if (!status) return "free";
    // Super Legend II
    if (status.clerkPlan === "super_legend_2" && status.clerkPlanStatus === "active") {
      return "tier2";
    }
    // Super Legend I
    if (status.clerkPlan === "super_legend" && status.clerkPlanStatus === "active") {
      return "tier1";
    }
    // Twitch T3 gets tier2
    if (status.twitchSubTier === 3) return "tier2";
    // Twitch T1/T2 gets tier1
    if (status.twitchSubTier && status.twitchSubTier >= 1) return "tier1";
    // Discord booster gets tier1
    if (status.discordBooster) return "tier1";
    return "free";
  }, [status]);

  const userTierLevel = getTierLevel(userTier);

  const isFeatureUnlocked = (feature: (typeof BENEFIT_CATEGORIES)[0]["features"][0]) => {
    if (feature.special === "twitch") {
      return status?.twitchSubTier != null;
    }
    if (feature.special === "discordBooster") {
      return status?.discordBooster === true;
    }
    if (!feature.minTier) return true;
    return userTierLevel >= getTierLevel(feature.minTier);
  };

  return (
    <SupporterView>
      <BackButtonWrapper>
        <BackButton href="/" />
      </BackButtonWrapper>

      <ContentContainer>
        <HeroSection>
          <HeroTitle>perks</HeroTitle>
          <HeroSubtitle>
            {isSignedIn ? (
              userTier === "free" ? (
                <>
                  You&apos;re on the free tier.{" "}
                  <UpgradeLink href="/support">Upgrade to unlock more!</UpgradeLink>
                </>
              ) : (
                <>
                  You&apos;re a{" "}
                  <TierBadge $tier={userTier}>
                    {userTier === "tier2" ? "Super Legend II" : "Super Legend I"}
                  </TierBadge>
                </>
              )
            ) : (
              <>
                <SignInLink href="/sign-in">Sign in</SignInLink> to see your benefits
              </>
            )}
          </HeroSubtitle>
        </HeroSection>

        <CategoriesGrid>
          {BENEFIT_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            return (
            <CategoryCard key={category.id}>
              <CategoryHeader>
                <CategoryIcon>
                  <IconComponent size={28} />
                </CategoryIcon>
                <CategoryInfo>
                  <CategoryTitle>{category.title}</CategoryTitle>
                  <CategoryDescription>{category.description}</CategoryDescription>
                </CategoryInfo>
              </CategoryHeader>

              <FeaturesList>
                {category.features.map((feature) => {
                  const unlocked = isSignedIn && !isLoading && isFeatureUnlocked(feature);
                  return (
                    <FeatureItem key={feature.id} $unlocked={unlocked}>
                      <FeatureIcon $unlocked={unlocked}>
                        {unlocked ? <Check size={14} /> : feature.comingSoon ? <Clock size={14} /> : <Lock size={14} />}
                      </FeatureIcon>
                      <FeatureContent>
                        <FeatureTitle>
                          {feature.title}
                          {feature.comingSoon && <ComingSoonTag>Coming Soon</ComingSoonTag>}
                        </FeatureTitle>
                        <FeatureDescription>{feature.description}</FeatureDescription>
                      </FeatureContent>
                      {"badgeType" in feature && feature.badgeType && (
                        <BadgePreview
                          href={"badgeLink" in feature ? feature.badgeLink : undefined}
                          target={"badgeLink" in feature && feature.badgeLink?.startsWith("http") ? "_blank" : undefined}
                          rel={"badgeLink" in feature && feature.badgeLink?.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          <SupporterBadge type={feature.badgeType} size="small" />
                        </BadgePreview>
                      )}
                      {feature.link && unlocked && (
                        <FeatureLink href={feature.link}>
                          <ChevronRight size={16} />
                        </FeatureLink>
                      )}
                    </FeatureItem>
                  );
                })}
              </FeaturesList>
            </CategoryCard>
          );
          })}
        </CategoriesGrid>

        <CTASection>
          {userTier !== "tier2" && (
            <>
              <CTATitle>Want more benefits?</CTATitle>
              <CTADescription>
                Upgrade your membership to unlock all features and support Nevulo!
              </CTADescription>
              <CTAButton href="/support">View Plans</CTAButton>
            </>
          )}
          {userTier === "tier2" && (
            <>
              <CTATitle>Thank you!</CTATitle>
              <CTADescription>
                You have access to all benefits. Your support means everything!
              </CTADescription>
            </>
          )}
        </CTASection>
      </ContentContainer>

      <Head>
        <title>Supporter Benefits - Nevulo</title>
        <meta
          name="description"
          content="Discover all the benefits of being a Super Legend supporter. Exclusive content, VIP access, badges, and more!"
        />
        <meta property="og:title" content="Supporter Benefits - Nevulo" />
        <meta
          property="og:description"
          content="Discover all the benefits of being a Super Legend supporter."
        />
        <meta property="og:url" content="https://nev.so/supporter" />
      </Head>
    </SupporterView>
  );
}

const SupporterView = styled(AnimatedMinimalView)`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 4rem;
`;

const BackButtonWrapper = styled.div`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 10;
`;

const ContentContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
  width: 100%;

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  padding-top: 2rem;
`;

const HeroTitle = styled.h1`
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(32px, 5vw, 48px);
  color: ${(props) => props.theme.contrast};
  margin: 0 0 1rem 0;
  letter-spacing: -1px;
`;

const HeroSubtitle = styled.p`
  font-family: var(--font-mono);
  font-size: 16px;
  color: ${(props) => props.theme.textColor};
  margin: 0;
`;

const TierBadge = styled.span<{ $tier: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  background: ${(props) =>
    props.$tier === "tier2"
      ? "linear-gradient(135deg, #ffd700, #ff8c00)"
      : "linear-gradient(135deg, #4f4dc1, #6b69d6)"};
  color: ${(props) => (props.$tier === "tier2" ? "#1a1a1a" : "white")};
`;

const UpgradeLink = styled(Link)`
  color: #4f4dc1;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const SignInLink = styled(Link)`
  color: #4f4dc1;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const CategoryCard = styled.div`
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(79, 77, 193, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(79, 77, 193, 0.4);
    box-shadow: 0 4px 20px rgba(79, 77, 193, 0.1);
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(79, 77, 193, 0.15);
`;

const CategoryIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(79, 77, 193, 0.15);
  color: #4f4dc1;
  flex-shrink: 0;
`;

const CategoryInfo = styled.div`
  flex: 1;
`;

const CategoryTitle = styled.h2`
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 18px;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 4px 0;
`;

const CategoryDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  opacity: 0.8;
`;

const FeaturesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FeatureItem = styled.div<{ $unlocked: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  background: ${(props) =>
    props.$unlocked ? "rgba(79, 77, 193, 0.08)" : "rgba(255, 255, 255, 0.02)"};
  opacity: ${(props) => (props.$unlocked ? 1 : 0.6)};
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$unlocked ? "rgba(79, 77, 193, 0.12)" : "rgba(255, 255, 255, 0.04)"};
  }
`;

const FeatureIcon = styled.div<{ $unlocked: boolean }>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(props) =>
    props.$unlocked ? "linear-gradient(135deg, #4f4dc1, #6b69d6)" : "rgba(255, 255, 255, 0.1)"};
  color: ${(props) => (props.$unlocked ? "white" : props.theme.textColor)};
`;

const FeatureContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const FeatureTitle = styled.div`
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  color: ${(props) => props.theme.contrast};
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ComingSoonTag = styled.span`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
`;

const FeatureDescription = styled.div`
  font-family: var(--font-sans);
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  line-height: 1.4;
  margin-top: 2px;
`;

const FeatureLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(79, 77, 193, 0.2);
  color: #4f4dc1;
  text-decoration: none;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(79, 77, 193, 0.3);
    transform: translateX(2px);
  }
`;

const BadgePreview = styled(Link)`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  text-decoration: none;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const CTASection = styled.div`
  text-align: center;
  margin-top: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(79, 77, 193, 0.1), rgba(107, 105, 214, 0.05));
  border-radius: 16px;
  border: 1px solid rgba(79, 77, 193, 0.2);
`;

const CTATitle = styled.h3`
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 24px;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
`;

const CTADescription = styled.p`
  font-family: var(--font-sans);
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 1.5rem 0;
`;

const CTAButton = styled(Link)`
  display: inline-block;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #4f4dc1, #6b69d6);
  color: white;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(79, 77, 193, 0.4);
  }
`;
