"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, Package, X } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import NevuloLogoSrc from "@/assets/svg/nevulo-huge-bold-svg.svg";
import { GrainOverlay } from "@/components/backgrounds/GrainOverlay";
import { SupporterBadge } from "@/components/badges/supporter-badge";
import { SupporterBadges } from "@/components/badges/supporter-badges";
import { BadgeType } from "@/constants/badges";
import { SocialLinks } from "@/components/generics";
import { AnnouncementBanner } from "@/components/generics/announcement-banner";
import { Skeleton } from "@/components/generics/skeleton";
import { FadeIn, FadeUp } from "@/components/home/animation";
import { AuthenticatedHome } from "@/components/home/AuthenticatedHome";
import { CanvasIntro } from "@/components/home/canvas-intro";
import { type BentoCardProps, BentoGrid } from "@/components/learn";
import { FeaturedProjectCard } from "@/components/project/featured-project";
import { ROUTES } from "@/constants/routes";
import type { DiscordWidget } from "@/types/discord";
import { fetchDiscordWidget } from "@/utils/discord-widget";

interface HomeProps {
  discordWidget: DiscordWidget | null;
  // Static data for unauthenticated homepage (fetched at build/ISR time)
  staticLearnPosts: any[] | null;
  staticProjects: any[] | null;
  staticFeaturedSoftware: any[] | null;
  staticFeaturedGames: any[] | null;
  staticFeaturedContent: any[] | null;
}

export default function Home({ discordWidget, staticLearnPosts, staticProjects, staticFeaturedSoftware, staticFeaturedGames, staticFeaturedContent }: HomeProps) {
  const [showCanvasIntro, setShowCanvasIntro] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [bannerOpacity, setBannerOpacity] = useState(1);
  const [isSocialHovered, setIsSocialHovered] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Handle scroll to fade out banner
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const fadeStart = 100;
      const fadeEnd = 400;

      if (scrollPosition <= fadeStart) {
        setBannerOpacity(1);
      } else if (scrollPosition >= fadeEnd) {
        setBannerOpacity(0);
      } else {
        const opacity = 1 - (scrollPosition - fadeStart) / (fadeEnd - fadeStart);
        setBannerOpacity(opacity);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Use static data from ISR (no Convex subscription for anonymous visitors)
  const allLearnPosts = staticLearnPosts;
  const learnPosts = allLearnPosts?.filter((p: any) => p.contentType !== "news");

  const handleIntroComplete = () => {
    setShowCanvasIntro(false);
    setShowContent(true);
  };

  // Get first 5 posts for homepage learn section (excluding shorts)
  const latestLearnPosts = learnPosts?.filter((p) => !p.labels?.includes("short"))?.slice(0, 5) ?? [];


  // Use static data from ISR
  const projects = staticProjects;
  const featuredProjects = projects?.filter((p: any) =>
    p.slug === "unloan" || p.slug === "flux" || p.slug === "compass"
  ) ?? [];

  const featuredSoftware = staticFeaturedSoftware;

  return (
    <>
      {/* Authenticated users see personalized dashboard */}
      <SignedIn>
        <AuthenticatedHome
          discordWidget={discordWidget}
          allWidgetPosts={allLearnPosts}
          featuredContent={staticFeaturedContent}
          featuredGames={staticFeaturedGames}
        />
      </SignedIn>

      {/* Non-authenticated users see the marketing homepage */}
      <SignedOut>
        {showCanvasIntro && <CanvasIntro onComplete={handleIntroComplete} />}

        {showContent && (
          <>
            <TopNavBar>
            {/* Mobile hamburger menu */}
            <MobileMenuWrapper ref={mobileMenuRef}>
              <HamburgerButton
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </HamburgerButton>
              {mobileMenuOpen && (
                <MobileMenu>
                  <MobileNavLink href={ROUTES.ABOUT} onClick={() => setMobileMenuOpen(false)}>
                    About
                  </MobileNavLink>
                  <MobileNavLink href={ROUTES.CONTACT} onClick={() => setMobileMenuOpen(false)}>
                    Contact
                  </MobileNavLink>
                  <MobileNavLink href={ROUTES.BLOG.ROOT} onClick={() => setMobileMenuOpen(false)}>
                    Explore
                  </MobileNavLink>
                  <MobileNavLink
                    href={ROUTES.PROJECTS.ROOT}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Work
                  </MobileNavLink>
                  <MobileNavLink href="/software" onClick={() => setMobileMenuOpen(false)}>
                    Software
                  </MobileNavLink>
                  <MobileNavLink href="/support" onClick={() => setMobileMenuOpen(false)}>
                    Support
                  </MobileNavLink>
                  <SignedIn>
                    <MobileMenuSeparator />
                    <MobileBadgesSection>
                      <SupporterBadges direction="column" showLabels size="small" />
                    </MobileBadgesSection>
                  </SignedIn>
                </MobileMenu>
              )}
            </MobileMenuWrapper>

            {/* Desktop nav links */}
            <DesktopNavLinks>
              <NavLink href={ROUTES.ABOUT}>About</NavLink>
              <NavLink href={ROUTES.CONTACT}>Contact</NavLink>
              <NavLink href={ROUTES.BLOG.ROOT}>Explore</NavLink>
              <NavLink href={ROUTES.PROJECTS.ROOT}>Work</NavLink>
              <NavLink href="/software">Software</NavLink>
              <NavLink href="/support">Support</NavLink>
            </DesktopNavLinks>

            {/* Auth container - always visible */}
            <AuthContainer>
              <SignedOut>
                <SignInButton mode="modal">
                  <LoginButton>login</LoginButton>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <DesktopOnly>
                  <SupporterBadges size="small" expandOnHover />
                </DesktopOnly>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: "28px",
                        height: "28px",
                      },
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link
                      href="/account"
                      label="My Account"
                      labelIcon={<AccountIcon />}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </SignedIn>
            </AuthContainer>
          </TopNavBar>

          <BackgroundImage aria-hidden="true" />
          <GrainOverlay />

          {/* Hero Section */}
          <Section>
            <SectionContent>
              <HeroContainer>
                <SocialContainer>
                  <FadeIn $delay={500}>
                    <BannerWrapper
                      style={{
                        opacity: bannerOpacity,
                        pointerEvents: bannerOpacity === 0 ? "none" : "auto",
                      }}
                    >
                      <AnnouncementBanner discordWidget={discordWidget} />
                    </BannerWrapper>
                  </FadeIn>

                  <FadeIn $delay={545}>
                    <SocialLinks
                      direction="row"
                      onHoverChange={setIsSocialHovered}
                    />
                  </FadeIn>
                  {/* IndieWeb h-card microformat for identity verification */}
                  <div className="h-card" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
                    <a className="u-url" rel="me" href="https://nev.so">Blake</a>
                    <a rel="me" href="https://lounge.nev.so/@nevulo">Mastodon</a>
                    <a rel="me" href="https://github.com/Nevvulo">GitHub</a>
                  </div>
                </SocialContainer>

                <HeaderContainer>
                  <TitleRow>
                    <FadeUp
                      $delay={100}
                      style={{ display: "flex", alignItems: "center", gap: "12px" }}
                    >
                      <LogoWrapper>
                        <Image
                          src={NevuloLogoSrc}
                          alt="Nevulo Logo"
                          width={48}
                          height={48}
                          priority
                        />
                      </LogoWrapper>
                      <NevuloTitle>
                        nev<ExtraV $show={isSocialHovered}>v</ExtraV>ulo
                      </NevuloTitle>
                    </FadeUp>
                  </TitleRow>
                  <TopRow>
                    <FadeUp $delay={50}>
                      <Badge>engineer</Badge>
                    </FadeUp>
                    <FadeUp $delay={150}>
                      <Badge>producer / dj</Badge>
                    </FadeUp>
                    <FadeUp $delay={250}>
                      <Badge>artist</Badge>
                    </FadeUp>
                  </TopRow>
                  <TopRow>
                    <FadeUp $delay={350}>
                      <NavButton href={ROUTES.ABOUT}>about me</NavButton>
                    </FadeUp>
                    <FadeUp $delay={400}>
                      <NavButton href={ROUTES.CONTACT}>contact</NavButton>
                    </FadeUp>
                  </TopRow>
                </HeaderContainer>
              </HeroContainer>

              <FadeUp $delay={650}>
                <ScrollHint>
                  <ScrollText>scroll to explore</ScrollText>
                  <ScrollArrow>↓</ScrollArrow>
                </ScrollHint>
              </FadeUp>
            </SectionContent>
          </Section>

          {/* Learn Section */}
          <Section>
            <LearnSectionContent>
              <LearnSectionHeader>
                <LearnTitle>explore</LearnTitle>
                <ViewAllLink href="/learn">View all →</ViewAllLink>
              </LearnSectionHeader>

              {latestLearnPosts.length > 0 ? (
                <BentoGrid posts={latestLearnPosts as BentoCardProps[]} />
              ) : (
                <SkeletonBentoGrid>
                  <SkeletonBentoCard $cols={3} $rows={2} />
                  <SkeletonBentoCard $cols={2} $rows={2} />
                  <SkeletonBentoCard $cols={2} $rows={1} />
                  <SkeletonBentoCard $cols={2} $rows={1} />
                  <SkeletonBentoCard $cols={1} $rows={1} />
                </SkeletonBentoGrid>
              )}
            </LearnSectionContent>
          </Section>

          {/* Software & Games Section */}
          <Section>
            <SoftwareSectionContent>
              <SectionHeader>
                <SectionTitle>
                  <SectionTitleSecondary>software & games</SectionTitleSecondary>
                </SectionTitle>
              </SectionHeader>

              <SoftwareGrid>
                {!featuredSoftware ? (
                  // Loading skeleton
                  <>
                    <SoftwareCardSkeleton $size="featured" />
                    <SoftwareCardSkeleton $size="medium" />
                    <SoftwareCardSkeleton $size="medium" />
                    <SoftwareCardSkeleton $size="small" />
                    <SoftwareCardSkeleton $size="small" />
                  </>
                ) : (
                  featuredSoftware.map((sw) => {
                    const accent = sw.accentColor ?? "#6366f1";
                    // Only order exactly 0 should be hero (strict check)
                    const isHero = typeof sw.order === "number" && sw.order === 0;
                    const size = isHero ? "hero" : (sw.displaySize ?? "medium");
                    const isComingSoon = sw.status === "coming-soon";
                    const isGame = sw.type === "game";
                    const hasBanner = !!sw.bannerUrl;

                    // Determine href based on openExternally flag
                    const getHref = () => {
                      if (sw.openExternally) {
                        if (isGame && sw.links?.roblox) return sw.links.roblox;
                        if (sw.links?.website) return sw.links.website;
                        if (sw.links?.github) return sw.links.github;
                      }
                      return isComingSoon ? undefined : `/software/${sw.slug}`;
                    };
                    const href = getHref();
                    const isExternal = href?.startsWith("http");
                    const statusMap: Record<string, "active" | "beta" | "soon"> = {
                      "active": "active",
                      "beta": "beta",
                      "coming-soon": "soon",
                    };
                    const statusLabel: Record<string, string> = {
                      "active": "Active",
                      "beta": "WIP",
                      "coming-soon": "Idea",
                    };

                    // Hero cards use different content wrapper with banner as full background
                    const ContentWrapper = isHero ? SoftwareHeroContent : (hasBanner ? SoftwareCardContentWithBanner : SoftwareCardContent);

                    return (
                      <SoftwareCard
                        key={sw.id}
                        $size={size}
                        $accent={accent}
                        $comingSoon={isComingSoon}
                        $hasBanner={hasBanner}
                        $isHero={isHero}
                        $heroBanner={isHero ? sw.bannerUrl : undefined}
                        href={isComingSoon ? undefined : href}
                        target={isExternal ? "_blank" : undefined}
                      >
                        <SoftwareCardGlow $color={accent} />
                        {hasBanner && !isHero && <SoftwareCardBanner $src={sw.bannerUrl!} />}
                        <ContentWrapper>
                          {!hasBanner && !isHero && (
                            <SoftwareIcon $color={accent} $hasLogo={!!sw.logoUrl}>
                              {sw.logoUrl ? (
                                <img src={sw.logoUrl} alt={sw.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                              ) : (
                                <Package size={28} />
                              )}
                            </SoftwareIcon>
                          )}
                          <SoftwareBadgeRow>
                            <SoftwareBadge $color={accent}>{sw.type.toUpperCase()}</SoftwareBadge>
                            {sw.status !== "archived" && (
                              <SoftwareStatus $status={statusMap[sw.status] ?? "active"}>
                                {statusLabel[sw.status] ?? sw.status}
                              </SoftwareStatus>
                            )}
                            {sw.platforms?.map((platform) => (
                              <SoftwarePlatformBadge key={platform}>{platform}</SoftwarePlatformBadge>
                            ))}
                          </SoftwareBadgeRow>
                          {isHero ? (
                            <>
                              <SoftwareHeroTitleRow>
                                {sw.logoUrl && (
                                  <SoftwareHeroIcon>
                                    <img src={sw.logoUrl} alt={sw.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                                  </SoftwareHeroIcon>
                                )}
                                <SoftwareHeroTitle>{sw.name}</SoftwareHeroTitle>
                              </SoftwareHeroTitleRow>
                              <SoftwareHeroDesc>{sw.shortDescription}</SoftwareHeroDesc>
                            </>
                          ) : (
                            <>
                              <SoftwareTitle>{sw.name}</SoftwareTitle>
                              <SoftwareDesc>{sw.shortDescription}</SoftwareDesc>
                            </>
                          )}
                          {sw.stats && (sw.stats.players || sw.stats.downloads || sw.stats.stars) && (
                            <SoftwareStats>
                              {sw.stats.players != null && (
                                <SoftwareStat>
                                  <span>{sw.stats.players.toLocaleString()}</span>
                                  <label>Players</label>
                                </SoftwareStat>
                              )}
                              {sw.stats.downloads != null && (
                                <SoftwareStat>
                                  <span>{sw.stats.downloads.toLocaleString()}</span>
                                  <label>Downloads</label>
                                </SoftwareStat>
                              )}
                              {sw.stats.stars != null && (
                                <SoftwareStat>
                                  <span>{sw.stats.stars.toLocaleString()}</span>
                                  <label>Stars</label>
                                </SoftwareStat>
                              )}
                            </SoftwareStats>
                          )}
                        </ContentWrapper>
                        <SoftwareCardScanlines />
                      </SoftwareCard>
                    );
                  })
                )}
              </SoftwareGrid>
            </SoftwareSectionContent>
          </Section>

          {/* Work History Section */}
          <Section>
            <WorkSectionContent>
              <SectionHeader>
                <SectionTitle>
                  <SectionTitleSecondary>work</SectionTitleSecondary>
                </SectionTitle>
                <ViewAllLink href={ROUTES.PROJECTS.ROOT}>View full timeline →</ViewAllLink>
              </SectionHeader>

              <WorkGrid>
                {/* Featured Current Work - Unloan */}
                {featuredProjects[0] && (
                  <FeaturedProjectCard
                    project={featuredProjects[0]}
                    href={`/projects?expand=${featuredProjects[0].slug}`}
                  />
                )}

                {/* Side Cards - Flux then Compass */}
                <WorkSideCards>
                  {/* Flux */}
                  {featuredProjects.find(p => p.slug === "flux") && (
                    <FeaturedProjectCard
                      project={featuredProjects.find(p => p.slug === "flux")!}
                      href="/projects?expand=flux"
                      isSmaller
                    />
                  )}
                  {/* Compass - smallest */}
                  {featuredProjects.find(p => p.slug === "compass") && (
                    <FeaturedProjectCard
                      project={featuredProjects.find(p => p.slug === "compass")!}
                      href="/projects?expand=compass"
                      isSmallest
                    />
                  )}
                </WorkSideCards>
              </WorkGrid>
            </WorkSectionContent>
          </Section>

          {/* Support Section */}
          <Section>
            <SupportSectionContent>
              <SupportHeader>
                <SupportTitle>
                  <span>support</span>
                  <SupportNevuloGroup>
                    <SupportLogo src={NevuloLogoSrc.src ?? NevuloLogoSrc} alt="Nevulo Logo" />
                    nevulo
                  </SupportNevuloGroup>
                </SupportTitle>
                <SupportSubtitle>
                  Get exclusive perks, early access, and help support my work
                </SupportSubtitle>
              </SupportHeader>

              <SupportTiers>
                <SupportTierCard href="/support" $featured>
                  <SupporterBadge type={BadgeType.SUPER_LEGEND} size="medium" showLabel />
                  <TierPrice>
                    $5<span>/mo</span>
                  </TierPrice>
                  <TierPerks>
                    <TierPerk>Exclusive Discord role & channels</TierPerk>
                    <TierPerk>Vault access - downloads & resources</TierPerk>
                    <TierPerk>Early access to games & content</TierPerk>
                    <TierPerk>Special badge on your profile</TierPerk>
                  </TierPerks>
                  <TierCTA>Learn More →</TierCTA>
                </SupportTierCard>
              </SupportTiers>
            </SupportSectionContent>
          </Section>

          <Head>
            <title>nevulo</title>
            <meta
              name="description"
              content="Creating digital experiences, focused on community"
            />

            <meta property="og:title" content="nevulo" />
            <meta
              property="og:description"
              content="Creating digital experiences, focused on community"
            />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://nev.so" />
            <meta property="og:site_name" content="nevulo" />
            <meta
              property="og:image"
              content="https://nev.so/api/og"
            />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Nevulo skull" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="nevulo" />
            <meta
              name="twitter:description"
              content="Engineer, producer, artist. Building exceptional digital experiences."
            />
            <meta
              name="twitter:image"
              content="https://nev.so/api/og"
            />
          </Head>
        </>
      )}
      </SignedOut>
    </>
  );
}

// Simple account icon for UserButton menu
const AccountIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const TopNavBar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 10px 1rem;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  background: ${(props) => props.theme.navbarBackground};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${(props) => props.theme.navbarBorder};
  z-index: 999;
`;

const DesktopNavLinks = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }

  @media (max-width: 650px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: ${(props) => props.theme.contrast};
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const MobileMenuWrapper = styled.div`
  position: absolute;
  left: 1rem;
  display: none;
  z-index: 10000;

  @media (max-width: 650px) {
    display: flex;
    align-items: center;
  }
`;

const HamburgerButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: ${(props) => props.theme.contrast};
  padding: 0;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const MobileMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: ${(props) => props.theme.menuBackground};
  backdrop-filter: blur(10px);
  border: 1px solid ${(props) => props.theme.menuBorder};
  border-radius: 8px;
  padding: 0.5rem 0;
  min-width: 150px;
  box-shadow: 0 4px 20px ${(props) => props.theme.menuShadow};
  z-index: 10000;
`;

const MobileNavLink = styled(Link)`
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${(props) => props.theme.contrast};
  text-decoration: none;
  padding: 0.75rem 1rem;
  opacity: 0.7;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    background: rgba(79, 77, 193, 0.1);
  }
`;

const MobileMenuSeparator = styled.div`
  height: 1px;
  background: rgba(79, 77, 193, 0.2);
  margin: 0.5rem 1rem;
`;

const MobileBadgesSection = styled.div`
  padding: 0.5rem 1rem 0.75rem;

  > div {
    align-items: flex-start;
  }
`;

const AuthContainer = styled.div`
  position: absolute;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DesktopOnly = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 650px) {
    display: none;
  }
`;

const LoginButton = styled.button`
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: ${(props) => props.theme.contrast};
  background: rgba(79, 77, 193, 0.2);
  border: 1px solid rgba(79, 77, 193, 0.4);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(79, 77, 193, 0.3);
    border-color: rgba(79, 77, 193, 0.6);
  }
`;

const BannerWrapper = styled.div`
  transition: opacity 0.3s ease-in-out;
  width: 100%;
  position: relative;
  min-height: 34px;
  height: 34px;
  margin-bottom: 0.5rem;

  > div {
    position: relative;
    width: 100%;
    max-width: none;
    left: 0;
    top: 0;
    transform: none;
  }
`;

const SocialContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const BackgroundImage = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  background-color: ${(props) => props.theme.background};
  transform: translateZ(0);
  will-change: transform;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/background.jpg');
    background-size: cover;
    background-position: center;
    opacity: 0.1;
    transform: translateZ(0);
  }
`;

// Full-screen section
const Section = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  padding-bottom: 15vh;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
    padding-bottom: 10vh;
  }
`;

const SectionContent = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// Hero section styles
const HeroContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
`;

const LogoWrapper = styled.div`
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  margin-right: clamp(2px, 2vw, 24px);
  filter: ${(props) => (props.theme.background === "#fff" ? "invert(1)" : "none")};

  @media (max-width: 400px) {
    margin-right: 0px;
    width: 32px;
    height: 32px;
  }
`;

const NevuloTitle = styled.h1`
  display: block;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-display);
  font-weight: 400;
  line-height: clamp(64px, 7vmax, 72px);
  font-size: clamp(4vw, 4.5vmax, 72px);
  text-wrap: nowrap;
  margin-bottom: 0px;
  margin-top: 0px;
  letter-spacing: -1.5px;
  font-variation-settings: "BLED" var(--bled), "SCAN" var(--scan);
  animation: subtleGlitch 8s ease-in-out infinite;

  @keyframes subtleGlitch {
    0%, 100% {
      --bled: 0;
      --scan: 0;
    }
    25% {
      --bled: 50;
      --scan: 30;
    }
    50% {
      --bled: 25;
      --scan: 55;
    }
    75% {
      --bled: 40;
      --scan: 20;
    }
  }
`;

const ExtraV = styled.span<{ $show: boolean }>`
  display: inline-block;
  max-width: ${(props) => (props.$show ? "1em" : "0")};
  opacity: ${(props) => (props.$show ? 1 : 0)};
  transform: scale(${(props) => (props.$show ? 1 : 0)}) translateY(3px);
  transform-origin: center;
  position: relative;
  top: -3px;
  transition: opacity 0.3s ease, transform 0.3s ease, max-width 0.3s ease;
  overflow: hidden;
  vertical-align: top;
`;

const TopRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const Badge = styled.div`
  background: rgba(79, 77, 193, 0.2);
  border: 1.5px solid rgba(79, 77, 193, 0.5);
  color: ${(props) => props.theme.contrast};
  padding: 6px 14px;
  border-radius: 20px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(79, 77, 193, 0.15);
`;

const NavButton = styled(Link)`
  background: rgba(79, 77, 193, 0.25);
  border: 1.5px solid rgba(79, 77, 193, 0.6);
  color: ${(props) => props.theme.contrast};
  padding: 6px 14px;
  border-radius: 20px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(79, 77, 193, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
  top: -2px;
  position: relative;

  &:hover {
    background: rgba(79, 77, 193, 0.35);
    border-color: rgba(79, 77, 193, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(79, 77, 193, 0.35);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ScrollHint = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  opacity: 0.6;

  @media (max-width: 768px) {
    margin-top: 2rem;
  }
`;

const ScrollText = styled.p`
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${(props) => props.theme.contrast};
  margin: 0;
  margin-right: 0.5rem;
`;

const ScrollArrow = styled.div`
  font-size: 24px;
  color: ${(props) => props.theme.contrast};
  animation: bounce 2s infinite;

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(8px);
    }
    60% {
      transform: translateY(4px);
    }
  }
`;

// Section header styles
const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SectionTitle = styled.h2`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  margin: 2rem 0 0 0;
`;

const SectionTitlePrimary = styled.span`
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(16px, 2.5vw, 24px);
  color: ${(props) => props.theme.contrast};
  letter-spacing: -0.5px;
  opacity: 0.6;
  font-variation-settings: "BLED" 0, "SCAN" 0;
`;

const SectionTitleSecondary = styled.span`
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(32px, 5vw, 48px);
  color: ${(props) => props.theme.contrast};
  letter-spacing: -1px;
  font-variation-settings: "BLED" 0, "SCAN" 0;
`;

const ViewAllLink = styled(Link)`
  font-family: var(--font-mono);
  font-size: 13px;
  color: ${(props) => props.theme.contrast};
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  white-space: nowrap;

  &:hover {
    opacity: 1;
  }
`;

// Learn section styles
const LearnSectionContent = styled.div`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const LearnSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 24px;
  margin-bottom: 0.5rem;

  @media (max-width: 900px) {
    padding: 0 16px;
  }
`;

const LearnTitle = styled.h2`
  margin: 0;
  font-size: 80px;
  font-weight: 900;
  color: ${(props) => props.theme.contrast};
  font-family: 'Protest Revolution', cursive;
  letter-spacing: 2px;
  transform: rotate(-3deg);
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 56px;
  }
`;

const SkeletonBentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 200px;
  gap: 16px;
  padding: 0 24px;
  contain: layout style;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 180px;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 180px;
    gap: 14px;
    padding: 0 16px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 16px;
  }
`;

const SkeletonBentoCard = styled(Skeleton)<{ $cols: number; $rows: number }>`
  border-radius: 16px;
  grid-column: span ${(p) => p.$cols};
  grid-row: span ${(p) => p.$rows};

  @media (max-width: 900px) {
    grid-column: span ${(p) => Math.min(p.$cols, 2)};
  }

  @media (max-width: 600px) {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
    min-height: 200px;
  }
`;

const ProjectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

// ============================================
// SOFTWARE SECTION STYLES
// ============================================

const SoftwareSectionContent = styled.div`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SoftwareGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto auto;
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SoftwareCardScanlines = styled.div`
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
  opacity: 0.5;
  border-radius: inherit;
`;

const SoftwareCard = styled.a<{ $size: "featured" | "medium" | "small" | "hero"; $accent: string; $comingSoon?: boolean; $hasBanner?: boolean; $isHero?: boolean; $heroBanner?: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.$isHero ? "0" : props.$hasBanner ? "0" : "1.25rem"};
  border-radius: 16px;
  background: ${(props) => props.$isHero && props.$heroBanner
    ? `linear-gradient(135deg, rgba(20, 15, 35, 0.85) 0%, rgba(30, 25, 50, 0.7) 100%)`
    : `linear-gradient(135deg, rgba(20, 15, 35, 0.9) 0%, rgba(30, 25, 50, 0.8) 100%)`};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${(props) => props.$accent}30;
  text-decoration: none;
  color: ${(props) => props.theme.contrast};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: ${(props) => (props.$comingSoon ? "default" : "pointer")};

  ${(props) => props.$isHero && props.$heroBanner && `
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url(${props.$heroBanner});
      background-size: cover;
      background-position: center;
      z-index: 0;
      opacity: 0.4;
    }
  `}

  ${(props) => {
    if (props.$size === "hero") {
      return `
        grid-column: span 2;
        grid-row: span 1;
        min-height: 200px;
      `;
    }
    if (props.$size === "featured") {
      return `
        grid-column: span 2;
        grid-row: span 2;
        min-height: 320px;
      `;
    }
    if (props.$size === "medium") {
      return `
        grid-column: span 1;
        grid-row: span 1;
        min-height: 200px;
      `;
    }
    return `
      grid-column: span 1;
      grid-row: span 1;
      min-height: 160px;
    `;
  }}

  ${(props) =>
    props.$comingSoon &&
    `
    opacity: 0.7;
    border-style: dashed;
  `}

  &:hover {
    transform: ${(props) => (props.$comingSoon ? "none" : "translateY(-4px)")};
    border-color: ${(props) => props.$accent}60;
    box-shadow: ${(props) =>
      props.$comingSoon
        ? "none"
        : `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 60px ${props.$accent}15`};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${(props) => props.$accent}50, transparent);
    z-index: 2;
  }

  @media (max-width: 900px) {
    ${(props) => (props.$size === "featured" || props.$size === "hero") && `
      grid-column: span 2;
      grid-row: span 1;
      min-height: 240px;
    `}
  }

  @media (max-width: 600px) {
    grid-column: span 1 !important;
    min-height: auto;
    padding: ${(props) => props.$isHero ? "0" : props.$hasBanner ? "0" : "1rem"};
  }
`;

const SoftwareCardBanner = styled.div<{ $src: string }>`
  position: relative;
  width: 100%;
  height: 140px;
  background-image: url(${(props) => props.$src});
  background-size: cover;
  background-position: center;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 30%, rgba(20, 15, 35, 0.95) 100%);
  }
`;

const SoftwareCardContentWithBanner = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem 1.25rem;
  margin-top: -2rem;
  flex: 1;
`;

const SoftwareHeroContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.5rem 2rem;
  flex: 1;
`;

const SoftwareHeroTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const SoftwareHeroIcon = styled.div`
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  @media (max-width: 600px) {
    width: 40px;
    height: 40px;
  }
`;

const SoftwareHeroTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 1.75rem;
  font-weight: 800;
  color: ${(props) => props.theme.contrast};
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);

  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

const SoftwareHeroDesc = styled.p`
  font-family: var(--font-sans);
  font-size: 1rem;
  color: ${(props) => props.theme.contrast}cc;
  margin: 0;
  line-height: 1.5;
  flex: 1;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  max-width: 80%;

  @media (max-width: 600px) {
    font-size: 0.875rem;
    max-width: 100%;
  }
`;

const SoftwarePlatformBadge = styled.span`
  display: inline-flex;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SoftwareCardGlow = styled.div<{ $color: string }>`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, ${(props) => props.$color}08 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
`;

const SoftwareCardContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SoftwareIcon = styled.div<{ $color: string; $hasLogo?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: ${(props) => props.$hasLogo ? "transparent" : `${props.$color}15`};
  border: ${(props) => props.$hasLogo ? "none" : `1px solid ${props.$color}30`};
  border-radius: 14px;
  color: ${(props) => props.$color};
  margin-bottom: 1rem;
  box-shadow: ${(props) => props.$hasLogo ? "none" : `0 0 20px ${props.$color}10`};
  overflow: hidden;
`;

const SoftwareBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const SoftwareBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
  background: ${(props) => props.$color}15;
  color: ${(props) => props.$color};
  border: 1px solid ${(props) => props.$color}30;
`;

const SoftwareStatus = styled.span<{ $status: "active" | "soon" | "beta" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
  background: ${(props) =>
    props.$status === "active"
      ? "rgba(34, 197, 94, 0.15)"
      : props.$status === "beta"
        ? "rgba(234, 179, 8, 0.15)"
        : "rgba(255, 255, 255, 0.05)"};
  color: ${(props) =>
    props.$status === "active"
      ? "#22c55e"
      : props.$status === "beta"
        ? "#eab308"
        : "rgba(255, 255, 255, 0.5)"};
  border: 1px solid ${(props) =>
    props.$status === "active"
      ? "rgba(34, 197, 94, 0.3)"
      : props.$status === "beta"
        ? "rgba(234, 179, 8, 0.3)"
        : "rgba(255, 255, 255, 0.1)"};

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    ${(props) => props.$status === "active" && `
      animation: statusPulse 2s ease-in-out infinite;
    `}
  }

  @keyframes statusPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

const SoftwareTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.375rem 0;
  letter-spacing: -0.5px;
`;

const SoftwareDesc = styled.p`
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: ${(props) => props.theme.contrast}70;
  margin: 0;
  line-height: 1.5;
  flex: 1;
`;

const SoftwareStats = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const SoftwareStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    font-weight: 700;
    color: ${(props) => props.theme.contrast};
  }

  label {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${(props) => props.theme.contrast}50;
  }
`;

const SoftwareCardSkeleton = styled.div<{ $size: "featured" | "medium" | "small" }>`
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(20, 15, 35, 0.9) 0%, rgba(30, 25, 50, 0.8) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  animation: skeletonPulse 1.5s ease-in-out infinite;

  ${(props) => {
    if (props.$size === "featured") {
      return `
        grid-column: span 2;
        grid-row: span 2;
        min-height: 320px;
      `;
    }
    if (props.$size === "medium") {
      return `
        min-height: 200px;
      `;
    }
    return `
      min-height: 160px;
    `;
  }}

  @keyframes skeletonPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.3; }
  }

  @media (max-width: 900px) {
    ${(props) => props.$size === "featured" && `
      grid-column: span 2;
      grid-row: span 1;
      min-height: 240px;
    `}
  }

  @media (max-width: 600px) {
    grid-column: span 1 !important;
    min-height: auto;
    height: 140px;
  }
`;

// ============================================
// WORK SECTION STYLES
// ============================================

const WorkSectionContent = styled.div`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const WorkGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const WorkSideCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const WorkCTACard = styled(Link)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  border-radius: 14px;
  background: transparent;
  border: 1px dashed rgba(144, 116, 242, 0.3);
  text-decoration: none;
  color: ${(props) => props.theme.contrast};
  transition: all 0.25s ease;
  min-height: 80px;

  &:hover {
    background: rgba(144, 116, 242, 0.05);
    border-color: rgba(144, 116, 242, 0.5);
    border-style: solid;
  }
`;

const WorkCTAContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const WorkCTAIcon = styled.div`
  color: rgba(144, 116, 242, 0.6);
`;

const WorkCTAText = styled.span`
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(144, 116, 242, 0.8);
`;

const WorkCTAArrow = styled.span`
  font-size: 1.25rem;
  color: rgba(144, 116, 242, 0.6);
  transition: transform 0.2s ease;

  ${WorkCTACard}:hover & {
    transform: translateX(4px);
  }
`;

// Support section styles
const SupportSectionContent = styled.div`
  width: 100%;
  text-align: center;
`;

const SupportHeader = styled.div`
  margin-bottom: 2rem;
`;

const SupportTitle = styled.h2`
  font-family: var(--font-display);
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 400;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
  letter-spacing: -1px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  white-space: nowrap;

  @media (max-width: 500px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const SupportNevuloGroup = styled.span`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SupportLogo = styled.img`
  width: 48px;
  height: 48px;
  flex-shrink: 0;
`;

const SupportSubtitle = styled.p`
  font-family: var(--font-sans);
  font-size: 1rem;
  color: ${(props) => props.theme.contrast}70;
  margin: 0;
`;

const SupportTiers = styled.div`
  display: flex;
  justify-content: center;
`;

const SupportTierCard = styled(Link)<{ $featured?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  border-radius: 20px;
  background: ${(props) =>
    props.$featured
      ? "linear-gradient(135deg, rgba(144, 116, 242, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)"
      : "rgba(255, 255, 255, 0.03)"};
  border: 1px solid ${(props) =>
    props.$featured ? "rgba(144, 116, 242, 0.4)" : "rgba(255, 255, 255, 0.1)"};
  text-decoration: none;
  width: 100%;
  max-width: 360px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(144, 116, 242, 0.2);
  }
`;

const TierPrice = styled.div`
  font-family: var(--font-sans);
  font-size: 2.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin-bottom: 1.5rem;

  span {
    font-size: 1rem;
    font-weight: 400;
    opacity: 0.6;
  }
`;

const TierPerks = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
  text-align: left;
  width: 100%;
`;

const TierPerk = styled.li`
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: ${(props) => props.theme.contrast}90;
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;

  &::before {
    content: "\u2713";
    position: absolute;
    left: 0;
    color: #10b981;
    font-weight: 600;
  }
`;

const TierCTA = styled.span`
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: #9074f2;
  text-transform: uppercase;
  letter-spacing: 1px;
`;
