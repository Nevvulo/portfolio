import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Menu, X } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import NevuloLogoSrc from "../assets/svg/nevulo-huge-bold-svg.svg";
import { SupporterBadges } from "../components/badges/supporter-badges";
import { SocialLinks } from "../components/generics";
import { AnnouncementBanner } from "../components/generics/announcement-banner";
import { Skeleton } from "../components/generics/skeleton";
import { FadeIn, FadeUp } from "../components/home/animation";
import { CanvasIntro } from "../components/home/canvas-intro";
import { type BentoCardProps, BentoGrid } from "../components/learn";
import { FeaturedProjectCard } from "../components/project/featured-project";
import { ROUTES } from "../constants/routes";
import { api } from "../convex/_generated/api";
import type { DiscordWidget } from "../types/discord";
import { fetchDiscordWidget } from "../utils/discord-widget";
import { checkTwitchLiveStatus } from "../utils/twitch";

interface HomeProps {
  discordWidget: DiscordWidget | null;
  isLive: boolean;
}

export default function Home({ discordWidget, isLive: serverIsLive }: HomeProps) {
  const [showCanvasIntro, setShowCanvasIntro] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [bannerOpacity, setBannerOpacity] = useState(1);
  const [isSocialHovered, setIsSocialHovered] = useState(false);

  // Allow overriding live status with ?mockLive=true query parameter for testing
  const [isLiveOverride, setIsLiveOverride] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mockLive = params.get("mockLive");
    if (mockLive === "true") {
      setIsLiveOverride(true);
      console.log("🔴 MOCK: Twitch live status set to TRUE");
    } else if (mockLive === "false") {
      setIsLiveOverride(false);
      console.log("⚫ MOCK: Twitch live status set to FALSE");
    }
  }, []);

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
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollPosition = target.scrollTop;
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

    const scrollContainer = document.getElementById("scroll-container");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
    return undefined;
  }, []);

  // First section locked, rest scrolls freely
  useEffect(() => {
    const scrollContainer = document.getElementById("scroll-container");
    if (!scrollContainer) return;

    const sections = scrollContainer.querySelectorAll("section");
    const secondSection = sections[1] as HTMLElement | undefined;
    if (!secondSection) return;

    let isAnimating = false;
    let accumulatedDelta = 0;
    const THRESHOLD = 30;

    const handleWheel = (e: WheelEvent) => {
      if (isAnimating) {
        e.preventDefault();
        return;
      }

      const scrollTop = scrollContainer.scrollTop;
      const inFirstSection = scrollTop < 50;

      if (!inFirstSection) {
        accumulatedDelta = 0;
        return; // Free scroll for rest of page
      }

      // In first section - block scroll and accumulate
      e.preventDefault();

      if (e.deltaY > 0) {
        accumulatedDelta += e.deltaY;

        if (accumulatedDelta >= THRESHOLD) {
          isAnimating = true;
          accumulatedDelta = 0;

          scrollContainer.scrollTo({
            top: secondSection.offsetTop,
            behavior: "smooth",
          });

          setTimeout(() => { isAnimating = false; }, 800);
        }
      }
    };

    scrollContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const isLive = isLiveOverride !== null ? isLiveOverride : serverIsLive;

  // Fetch learn posts from Convex
  const learnPosts = useQuery(api.blogPosts.getForBento, { excludeNews: true });

  const handleIntroComplete = () => {
    setShowCanvasIntro(false);
    setShowContent(true);
  };

  // Get first 5 posts for homepage learn section
  const latestLearnPosts = learnPosts?.slice(0, 5) ?? [];

  // DEBUG: Check bento sizes from Convex
  if (learnPosts?.length) {
    console.log(
      "Learn posts bento sizes:",
      learnPosts.map((p) => ({ title: p.title, bentoSize: p.bentoSize })),
    );
  }

  // Get featured projects from Convex
  const projects = useQuery(api.projects.listActive);
  const featuredProjects = projects?.filter((p) => p.slug === "unloan" || p.slug === "flux") ?? [];

  return (
    <>
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
                    Projects
                  </MobileNavLink>
                  <MobileNavLink href="/games" onClick={() => setMobileMenuOpen(false)}>
                    Games
                  </MobileNavLink>
                  <MobileNavLink href="/live" onClick={() => setMobileMenuOpen(false)}>
                    Live
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
              <NavLink href={ROUTES.PROJECTS.ROOT}>Projects</NavLink>
              <NavLink href="/games">Games</NavLink>
              <NavLink href="/live">Live</NavLink>
              <NavLink href="/support">Support</NavLink>
            </DesktopNavLinks>

            {/* Auth container - always visible */}
            <AuthContainer>
              <SignedOut>
                <SignInButton mode="modal">
                  <LoginButton>Login</LoginButton>
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
                      <AnnouncementBanner isLive={isLive} discordWidget={discordWidget} />
                    </BannerWrapper>
                  </FadeIn>

                  <FadeIn $delay={545}>
                    <SocialLinks
                      direction="row"
                      hideTwitch={isLive}
                      onHoverChange={setIsSocialHovered}
                    />
                  </FadeIn>
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

          {/* Projects Section */}
          <Section>
            <SectionContent>
              <SectionHeader>
                <SectionTitle>
                  <SectionTitlePrimary>latest</SectionTitlePrimary>
                  <SectionTitleSecondary>projects</SectionTitleSecondary>
                </SectionTitle>
                <ViewAllLink href={ROUTES.PROJECTS.ROOT}>View all projects →</ViewAllLink>
              </SectionHeader>

              <ProjectsContainer>
                {featuredProjects.map((project) => (
                  <FeaturedProjectCard
                    key={project.slug}
                    project={project}
                    href={`/projects?expand=${project.slug}`}
                    isSmaller={project.slug === "flux"}
                  />
                ))}
              </ProjectsContainer>
            </SectionContent>
          </Section>

          <Head>
            <title>Nevulo - Software Engineer | Portfolio</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
              href="https://fonts.googleapis.com/css2?family=Protest+Revolution&display=swap"
              rel="stylesheet"
            />
            <meta
              name="description"
              content="Software engineer based in Melbourne, Australia. Building exceptional digital experiences with modern web technologies."
            />

            <meta property="og:title" content="Nevulo - Software Engineer" />
            <meta
              property="og:description"
              content="Software engineer based in Melbourne, Australia. Building exceptional digital experiences with modern web technologies."
            />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://nev.so" />
            <meta property="og:site_name" content="Blake's Portfolio" />
            <meta
              property="og:image"
              content="https://nev.so/api/og?title=Blake%20-%20Software%20Engineer&subtitle=Building%20exceptional%20digital%20experiences%20in%20Melbourne"
            />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Blake - Software Engineer Portfolio" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Nevulo - Software Engineer" />
            <meta
              name="twitter:description"
              content="Software engineer based in Melbourne, Australia. Building exceptional digital experiences with modern web technologies."
            />
            <meta
              name="twitter:image"
              content="https://nev.so/api/og?title=Blake%20-%20Software%20Engineer&subtitle=Building%20exceptional%20digital%20experiences%20in%20Melbourne"
            />
          </Head>
        </>
      )}
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
  background: rgba(17, 17, 17, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(79, 77, 193, 0.1);
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
  background: rgba(17, 17, 17, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(79, 77, 193, 0.2);
  border-radius: 8px;
  padding: 0.5rem 0;
  min-width: 150px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
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

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/background.jpg');
    background-size: cover;
    background-position: center;
    opacity: 0.1;
  }
`;

// Full-screen section with snap
const Section = styled.section`
  min-height: 100vh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
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
  margin-right: 26px;
  filter: ${(props) => (props.theme.background === "#fff" ? "invert(1)" : "none")};
`;

const NevuloTitle = styled.h1`
  display: block;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-display);
  font-weight: 400;
  line-height: clamp(64px, 7vmax, 72px);
  font-size: clamp(4vh, 5.6vmax, 82px);
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
  gap: 0.5rem;
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 6rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

export async function getStaticProps() {
  const [discordWidget, isLive] = await Promise.all([
    fetchDiscordWidget(),
    checkTwitchLiveStatus(),
  ]);

  return {
    props: {
      discordWidget,
      isLive,
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
}
