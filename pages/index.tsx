import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styled from "styled-components";
import NevuloLogoSrc from "../assets/svg/nevulo-huge-bold-svg.svg";
import { SupporterBadges } from "../components/badges/supporter-badges";
import { PostPreview } from "../components/blog/post-preview";
import { SocialLinks } from "../components/generics";
import { AnnouncementBanner } from "../components/generics/announcement-banner";
import { FadeIn, FadeUp } from "../components/home/animation";
import { CanvasIntro } from "../components/home/canvas-intro";
import { FeaturedProjectPreview } from "../components/project/featured-project";
import { ROUTES } from "../constants/routes";
import { Projects } from "../constants/projects";
import getFile from "../modules/getFile";
import type { Blogmap } from "../types/blog";
import type { DiscordWidget } from "../types/discord";
import { fetchDiscordWidget } from "../utils/discord-widget";
import { checkTwitchLiveStatus } from "../utils/twitch";

interface HomeProps {
  discordWidget: DiscordWidget | null;
  isLive: boolean;
  posts: Blogmap;
}

export default function Home({ discordWidget, isLive: serverIsLive, posts }: HomeProps) {
  const [showCanvasIntro, setShowCanvasIntro] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [bannerOpacity, setBannerOpacity] = useState(1);
  const [isSocialHovered, setIsSocialHovered] = useState(false);

  // Allow overriding live status with ?mockLive=true query parameter for testing
  const [isLiveOverride, setIsLiveOverride] = useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mockLive = params.get('mockLive');
    if (mockLive === 'true') {
      setIsLiveOverride(true);
      console.log('🔴 MOCK: Twitch live status set to TRUE');
    } else if (mockLive === 'false') {
      setIsLiveOverride(false);
      console.log('⚫ MOCK: Twitch live status set to FALSE');
    }
  }, []);

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

    const scrollContainer = document.getElementById('scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, []);

  const isLive = isLiveOverride !== null ? isLiveOverride : serverIsLive;

  const handleIntroComplete = () => {
    setShowCanvasIntro(false);
    setShowContent(true);
  };

  // Get latest posts and projects
  const latestPosts = posts.slice(0, 3);
  const featuredProjects = Projects.filter(p => p.projectId === "unloan" || p.projectId === "flux");

  return (
    <ScrollContainer id="scroll-container">
      {showCanvasIntro && <CanvasIntro onComplete={handleIntroComplete} />}

      {showContent && (
        <>
          <TopNavBar>
            <NavLink href={ROUTES.ABOUT}>About</NavLink>
            <NavLink href={ROUTES.CONTACT}>Contact</NavLink>
            <NavLink href={ROUTES.BLOG.ROOT}>Blog</NavLink>
            <NavLink href={ROUTES.PROJECTS.ROOT}>Projects</NavLink>
            <NavLink href="/games">Games</NavLink>
            <NavLink href="/live">Live</NavLink>
            <NavLink href="/support">Support</NavLink>

            <DesktopAuthContainer>
              <SignedOut>
                <SignInButton mode="modal">
                  <LoginButton>Sign In</LoginButton>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <SupporterBadges size="small" expandOnHover />
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
                    <UserButton.Link href="/account" label="My Account" labelIcon={<AccountIcon />} />
                  </UserButton.MenuItems>
                </UserButton>
              </SignedIn>
            </DesktopAuthContainer>
          </TopNavBar>

          {/* Mobile sign in - directly under navbar */}
          <MobileSignInBar>
            <SignedOut>
              <SignInButton mode="modal">
                <MobileSignInButton>Sign In</MobileSignInButton>
              </SignInButton>
            </SignedOut>
          </MobileSignInBar>

          {/* Mobile bottom bar - only for signed in users */}
          <MobileBottomBar>
            <SignedIn>
              <MobileBadgesContainer>
                <SupporterBadges size="small" />
              </MobileBadgesContainer>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: {
                      width: "32px",
                      height: "32px",
                    },
                  },
                }}

              >
                <UserButton.MenuItems>
                  <UserButton.Link href="/account" label="My Account" labelIcon={<AccountIcon />} />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </MobileBottomBar>

          <BackgroundImage aria-hidden="true" />

          {/* Hero Section */}
          <Section>
            <SectionContent>
              <HeroContainer>
                <SocialContainer>
                  <FadeIn $delay={500}>
                    <BannerWrapper style={{ opacity: bannerOpacity, pointerEvents: bannerOpacity === 0 ? 'none' : 'auto' }}>
                      <AnnouncementBanner isLive={isLive} discordWidget={discordWidget} />
                    </BannerWrapper>
                  </FadeIn>

                  <FadeIn $delay={545}>
                    <SocialLinks direction='row' hideTwitch={isLive} onHoverChange={setIsSocialHovered} />
                  </FadeIn>
                </SocialContainer>

                <HeaderContainer>
                  <TitleRow>
                    <FadeUp $delay={100} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

          {/* Blog Section */}
          <Section>
            <SectionContent>
              <SectionHeader>
                <SectionTitle>
                  <SectionTitlePrimary>latest</SectionTitlePrimary>
                  <SectionTitleSecondary>blog</SectionTitleSecondary>
                </SectionTitle>
                <ViewAllLink href={ROUTES.BLOG.ROOT}>
                  View all posts →
                </ViewAllLink>
              </SectionHeader>

              <PreviewContainer>
                {latestPosts.map((post, i) => (
                  <PostPreview key={post.slug} prioritizeImage={i === 0} {...post} />
                ))}
              </PreviewContainer>
            </SectionContent>
          </Section>

          {/* Projects Section */}
          <Section>
            <SectionContent>
              <SectionHeader>
                <SectionTitle>
                  <SectionTitlePrimary>latest</SectionTitlePrimary>
                  <SectionTitleSecondary>projects</SectionTitleSecondary>
                </SectionTitle>
                <ViewAllLink href={ROUTES.PROJECTS.ROOT}>
                  View all projects →
                </ViewAllLink>
              </SectionHeader>

              <ProjectsContainer>
                {featuredProjects.map((project) => (
                  <FeaturedProjectPreview
                    key={project.projectId}
                    href={`/projects/${project.projectId}`}
                    isSmaller={project.projectId === "flux"}
                    {...project}
                  />
                ))}
              </ProjectsContainer>
            </SectionContent>
          </Section>

      <Head>
        <title>Nevulo - Software Engineer | Portfolio</title>
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
        <meta property="og:url" content="https://nevulo.xyz" />
        <meta property="og:site_name" content="Blake's Portfolio" />
        <meta
          property="og:image"
          content="https://nevulo.xyz/api/og?title=Blake%20-%20Software%20Engineer&subtitle=Building%20exceptional%20digital%20experiences%20in%20Melbourne"
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
          content="https://nevulo.xyz/api/og?title=Blake%20-%20Software%20Engineer&subtitle=Building%20exceptional%20digital%20experiences%20in%20Melbourne"
        />
      </Head>
        </>
      )}
    </ScrollContainer>
  );
}

// Simple account icon for UserButton menu
const AccountIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Scroll container with snap effect
const ScrollContainer = styled.div`
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;

  /* Hide scrollbar for cleaner look */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TopNavBar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 0.5rem;
  padding-top: calc(0.5rem + env(safe-area-inset-top, 0px));
  background: rgba(17, 17, 17, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(79, 77, 193, 0.1);
  z-index: 999;

  @media (max-width: 768px) {
    gap: 1rem;
    padding: 0.5rem;
    padding-top: calc(0.5rem + env(safe-area-inset-top, 0px));
  }

  @media (max-width: 650px) {
    gap: 0.6rem;
    padding: 0.4rem 0.5rem;
    padding-top: calc(0.4rem + env(safe-area-inset-top, 0px));
  }
`;

const NavLink = styled(Link)`
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace;
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

  @media (max-width: 650px) {
    font-size: 10px;
    letter-spacing: 0.8px;
  }
`;

const DesktopAuthContainer = styled.div`
  position: absolute;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 650px) {
    display: none;
  }
`;

const MobileSignInBar = styled.div`
  display: none;

  @media (max-width: 650px) {
    display: flex;
    position: fixed;
    top: calc(32px + env(safe-area-inset-top, 0px));
    left: 0;
    right: 0;
    justify-content: flex-end;
    padding: 0.5rem 1rem;
    z-index: 998;
  }
`;

const MobileBottomBar = styled.div`
  display: none;

  @media (max-width: 650px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.75rem 1rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
    background: transparent;
    z-index: 999;
    justify-content: space-between;
    align-items: center;
  }
`;

const MobileBadgesContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MobileSignInButton = styled.button`
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${(props) => props.theme.contrast};
  background: transparent;
  border: none;
  padding: 8px 0;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  margin: 0 auto;

  &:hover {
    opacity: 1;
  }
`;

const LoginButton = styled.button`
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace;
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
  z-index: -1;
  background-image: url('/background.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.1;
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
`;

const NevuloTitle = styled.h1`
  display: block;
  color: ${(props) => props.theme.contrast};
  font-family: "Sixtyfour", monospace;
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
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace;
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
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace;
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
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace;
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
  margin: 4rem 0 0 0;
`;

const SectionTitlePrimary = styled.span`
  font-family: "Sixtyfour", monospace;
  font-weight: 400;
  font-size: clamp(16px, 2.5vw, 24px);
  color: ${(props) => props.theme.contrast};
  letter-spacing: -0.5px;
  opacity: 0.6;
  font-variation-settings: "BLED" 0, "SCAN" 0;
`;

const SectionTitleSecondary = styled.span`
  font-family: "Sixtyfour", monospace;
  font-weight: 400;
  font-size: clamp(32px, 5vw, 48px);
  color: ${(props) => props.theme.contrast};
  letter-spacing: -1px;
  font-variation-settings: "BLED" 0, "SCAN" 0;
`;

const ViewAllLink = styled(Link)`
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace;
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

// Preview containers
const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const ProjectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

export async function getStaticProps() {
  const [discordWidget, isLive, posts] = await Promise.all([
    fetchDiscordWidget(),
    checkTwitchLiveStatus(),
    getFile("blogmap.json"),
  ]);

  return {
    props: {
      discordWidget,
      isLive,
      posts: posts || [],
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
}
