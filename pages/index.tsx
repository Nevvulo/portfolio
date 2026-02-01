import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Calendar, ChevronLeft, ChevronRight, Menu, Play, X, Zap } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import GolfquestBanner from "../assets/img/games/golfquest.png";
import NevuloLogoSrc from "../assets/svg/nevulo-huge-bold-svg.svg";
import { SupporterBadges } from "../components/badges/supporter-badges";
import { SocialLinks } from "../components/generics";
import { AnnouncementBanner } from "../components/generics/announcement-banner";
import { Skeleton } from "../components/generics/skeleton";
import { FadeIn, FadeUp } from "../components/home/animation";
import { AuthenticatedHome } from "../components/home/AuthenticatedHome";
import { CanvasIntro } from "../components/home/canvas-intro";
import { type BentoCardProps, BentoGrid } from "../components/learn";
import { FeaturedProjectCard } from "../components/project/featured-project";
import { ROUTES } from "../constants/routes";
import Socials from "../constants/socials";
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

  // Shorts carousel state
  const [playingShortId, setPlayingShortId] = useState<string | null>(null);
  const shortsCarouselRef = useRef<HTMLDivElement>(null);

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

  // Get featured projects from Convex (unloan, flux, compass)
  const projects = useQuery(api.projects.listActive);
  const featuredProjects = projects?.filter((p) =>
    p.slug === "unloan" || p.slug === "flux" || p.slug === "compass"
  ) ?? [];

  // Get shorts for Live section carousel
  const shortsPosts =
    learnPosts
      ?.filter((p) => p.contentType === "video" && p.labels?.includes("short"))
      ?.slice(0, 10) ?? [];

  // Carousel scroll handlers
  const scrollShortsCarousel = (direction: "left" | "right") => {
    if (shortsCarouselRef.current) {
      const scrollAmount = 200;
      shortsCarouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Get stream settings and events
  const streamSettings = useQuery(api.stream.getStreamSettings);
  const upcomingEvents = useQuery(api.stream.getUpcomingEvents);

  // Get game-related posts for Games section
  const gamePosts =
    learnPosts
      ?.filter((p) =>
        p.labels?.some(
          (label: string) =>
            label.toLowerCase().includes("game") ||
            label.toLowerCase().includes("roblox") ||
            label.toLowerCase().includes("golfquest"),
        ),
      )
      ?.slice(0, 3) ?? [];

  return (
    <>
      {/* Authenticated users see personalized dashboard */}
      <SignedIn>
        <AuthenticatedHome isLive={isLive} discordWidget={discordWidget} />
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

          {/* Live / Events & Videos Section */}
          <Section>
            <LiveSectionContent>
              <SectionHeader>
                <SectionTitle>
                  <SectionTitlePrimary>events &</SectionTitlePrimary>
                  <SectionTitleSecondary>videos</SectionTitleSecondary>
                </SectionTitle>
                <ViewAllLink href="/live">View all →</ViewAllLink>
              </SectionHeader>

              {/* Top Row: Stream-O-Meter + Events Calendar */}
              <LiveTopRow>
                {/* Stream-O-Meter */}
                <StreamOMeterCard href="https://twitch.tv/Nevvulo" target="_blank" $isLive={isLive}>
                  {isLive && (
                    <LiveBadge>
                      <LivePulse />
                      LIVE
                    </LiveBadge>
                  )}
                  <StreamOMeterHeader>
                    <Zap size={18} />
                    <span>Stream-O-Meter</span>
                  </StreamOMeterHeader>
                  <StreamOMeterLabel $chance={streamSettings?.streamChance ?? 0}>
                    {(streamSettings?.streamChance ?? 0) >= 80
                      ? "Very likely!"
                      : (streamSettings?.streamChance ?? 0) >= 50
                        ? "Good chance"
                        : (streamSettings?.streamChance ?? 0) >= 20
                          ? "Maybe"
                          : "Not today"}
                  </StreamOMeterLabel>
                  <StreamOMeterBar>
                    <StreamOMeterSegments>
                      {[...Array(10)].map((_, i) => (
                        <StreamOMeterSegment
                          key={i}
                          $active={i < Math.ceil((streamSettings?.streamChance ?? 0) / 10)}
                          $chance={streamSettings?.streamChance ?? 0}
                        />
                      ))}
                    </StreamOMeterSegments>
                  </StreamOMeterBar>
                  <StreamOMeterValue $chance={streamSettings?.streamChance ?? 0}>
                    {streamSettings?.streamChance ?? 0}%
                  </StreamOMeterValue>
                  {streamSettings?.streamChanceMessage && (
                    <StreamOMeterMessage>{streamSettings.streamChanceMessage}</StreamOMeterMessage>
                  )}
                </StreamOMeterCard>

                {/* Events Calendar */}
                <EventsCalendarCard>
                  <EventsCalendarHeader>
                    <Calendar size={16} />
                    <span>Upcoming Events</span>
                  </EventsCalendarHeader>
                  {!upcomingEvents || upcomingEvents.length === 0 ? (
                    <NoEventsState>
                      <Calendar size={20} />
                      <span>No upcoming events</span>
                    </NoEventsState>
                  ) : (
                    <EventsList>
                      {upcomingEvents.slice(0, 3).map((event) => (
                        <EventItem key={event._id}>
                          <EventDate>
                            {new Date(event.scheduledStartTime).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </EventDate>
                          <EventName>{event.name}</EventName>
                        </EventItem>
                      ))}
                    </EventsList>
                  )}
                </EventsCalendarCard>
              </LiveTopRow>

              {/* Twitch + Discord Embeds Row */}
              <LiveEmbeds>
                <LiveEmbedCard href="https://twitch.tv/Nevvulo" target="_blank" $isLive={isLive}>
                  <LiveEmbedIcon $color="#9146ff">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                    </svg>
                  </LiveEmbedIcon>
                  <LiveEmbedContent>
                    <LiveEmbedTitle>{isLive ? "Live Now!" : "Twitch"}</LiveEmbedTitle>
                    <LiveEmbedSubtitle>twitch.tv/Nevvulo</LiveEmbedSubtitle>
                  </LiveEmbedContent>
                </LiveEmbedCard>

                <LiveEmbedCard href={Socials.Discord} target="_blank">
                  <LiveEmbedIcon $color="#5865f2">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </LiveEmbedIcon>
                  <LiveEmbedContent>
                    <LiveEmbedTitle>Discord</LiveEmbedTitle>
                    <LiveEmbedSubtitle>
                      {discordWidget?.presence_count ? (
                        <OnlineIndicator>
                          <OnlineDot />
                          {discordWidget.presence_count} online
                        </OnlineIndicator>
                      ) : (
                        "Join us"
                      )}
                    </LiveEmbedSubtitle>
                  </LiveEmbedContent>
                </LiveEmbedCard>
              </LiveEmbeds>

              {/* Shorts Carousel */}
              {shortsPosts.length > 0 && (
                <ShortsSection>
                  <ShortsSectionHeader>
                    <ShortsSectionTitle>Shorts</ShortsSectionTitle>
                    <ShortsNavButtons>
                      <ShortsNavButton
                        onClick={() => scrollShortsCarousel("left")}
                        aria-label="Scroll left"
                      >
                        <ChevronLeft size={18} />
                      </ShortsNavButton>
                      <ShortsNavButton
                        onClick={() => scrollShortsCarousel("right")}
                        aria-label="Scroll right"
                      >
                        <ChevronRight size={18} />
                      </ShortsNavButton>
                    </ShortsNavButtons>
                  </ShortsSectionHeader>
                  <ShortsCarousel ref={shortsCarouselRef}>
                    {shortsPosts.map((short) => (
                      <ShortCard
                        key={short._id}
                        onClick={() =>
                          setPlayingShortId(playingShortId === short._id ? null : short._id)
                        }
                      >
                        {playingShortId === short._id && short.youtubeId ? (
                          <ShortEmbed>
                            <iframe
                              src={`https://www.youtube.com/embed/${short.youtubeId}?autoplay=1&rel=0`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={short.title}
                            />
                          </ShortEmbed>
                        ) : (
                          <ShortThumbnail>
                            {short.coverImage ? (
                              <Image
                                src={short.coverImage}
                                alt={short.title}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            ) : short.youtubeId ? (
                              <Image
                                src={`https://img.youtube.com/vi/${short.youtubeId}/maxresdefault.jpg`}
                                alt={short.title}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <ShortPlaceholder />
                            )}
                            <ShortOverlay>
                              <ShortPlayButton>
                                <Play size={24} fill="white" />
                              </ShortPlayButton>
                              <ShortTitle>{short.title}</ShortTitle>
                            </ShortOverlay>
                          </ShortThumbnail>
                        )}
                      </ShortCard>
                    ))}
                  </ShortsCarousel>
                </ShortsSection>
              )}

              {/* Empty state if no shorts */}
              {shortsPosts.length === 0 && (
                <LiveVideosEmpty>
                  <Play size={24} />
                  <span>Videos coming soon</span>
                </LiveVideosEmpty>
              )}
            </LiveSectionContent>
          </Section>

          {/* Games Section */}
          <Section>
            <GamesSectionContent>
              <SectionHeader>
                <SectionTitle>
                  <SectionTitlePrimary>explore</SectionTitlePrimary>
                  <SectionTitleSecondary>games</SectionTitleSecondary>
                </SectionTitle>
                <ViewAllLink href="/games">View all →</ViewAllLink>
              </SectionHeader>

              {/* Featured Games Row */}
              <GamesCardsRow>
                <GolfquestCard href="/games/golfquest">
                  <GolfquestImageWrapper>
                    <Image
                      src={GolfquestBanner}
                      alt="Golfquest"
                      fill
                      style={{ objectFit: "cover" }}
                    />
                    <GolfquestOverlay />
                  </GolfquestImageWrapper>
                  <GolfquestContent>
                    <GolfquestBadges>
                      <GolfquestBadge>Coming 2026</GolfquestBadge>
                      <GolfquestPlatform>Roblox</GolfquestPlatform>
                    </GolfquestBadges>
                    <GolfquestTitle>Golfquest</GolfquestTitle>
                    <GolfquestDesc>Golf adventure with precision mechanics</GolfquestDesc>
                  </GolfquestContent>
                </GolfquestCard>

                <SecretGameCard>
                  <SecretGameContent>
                    <SecretGameIcon>?</SecretGameIcon>
                    <SecretGameBadge>Coming 2027</SecretGameBadge>
                    <SecretGameTitle>Secret Project</SecretGameTitle>
                    <SecretGameDesc>Reveal coming soon...</SecretGameDesc>
                  </SecretGameContent>
                  <SecretGameGlow />
                </SecretGameCard>
              </GamesCardsRow>

              {/* Game Articles Row - 3x1 on desktop, 1x3 on mobile */}
              {gamePosts.length > 0 && (
                <GamesArticleGrid>
                  {gamePosts.map((post) => (
                    <GameArticleCard key={post._id} href={`/learn/${post.slug}`}>
                      <GameArticleThumbnail>
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <GameArticlePlaceholder />
                        )}
                        <GameArticleOverlay />
                      </GameArticleThumbnail>
                      <GameArticleContent>
                        {post.labels?.length > 0 && (
                          <GameArticleLabel>{post.labels[0]}</GameArticleLabel>
                        )}
                        <GameArticleTitle>{post.title}</GameArticleTitle>
                      </GameArticleContent>
                    </GameArticleCard>
                  ))}
                </GamesArticleGrid>
              )}
            </GamesSectionContent>
          </Section>

          {/* Software Section */}
          <Section>
            <SoftwareSectionContent>
              <SectionHeader>
                <SectionTitle>
                  <SectionTitlePrimary>my</SectionTitlePrimary>
                  <SectionTitleSecondary>software</SectionTitleSecondary>
                </SectionTitle>
              </SectionHeader>

              <SoftwareGrid>
                {/* Nevi Discord Bot - Featured */}
                <SoftwareCard $size="featured" $accent="#5865f2" href="https://github.com/Nevvulo/nevi" target="_blank">
                  <SoftwareCardGlow $color="#5865f2" />
                  <SoftwareCardContent>
                    <SoftwareIcon $color="#5865f2">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    </SoftwareIcon>
                    <SoftwareBadgeRow>
                      <SoftwareBadge $color="#5865f2">Discord Bot</SoftwareBadge>
                      <SoftwareStatus $status="active">Active</SoftwareStatus>
                    </SoftwareBadgeRow>
                    <SoftwareTitle>Nevi</SoftwareTitle>
                    <SoftwareDesc>Multi-purpose Discord bot with moderation, music, and custom commands. Powers multiple community servers.</SoftwareDesc>
                    <SoftwareStats>
                      <SoftwareStat>
                        <span>10+</span>
                        <label>Servers</label>
                      </SoftwareStat>
                      <SoftwareStat>
                        <span>50+</span>
                        <label>Commands</label>
                      </SoftwareStat>
                    </SoftwareStats>
                  </SoftwareCardContent>
                  <SoftwareCardScanlines />
                </SoftwareCard>

                {/* Feed / Link-in-bio */}
                <SoftwareCard $size="medium" $accent="#9074f2" href="/feed">
                  <SoftwareCardGlow $color="#9074f2" />
                  <SoftwareCardContent>
                    <SoftwareIcon $color="#9074f2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </SoftwareIcon>
                    <SoftwareBadgeRow>
                      <SoftwareBadge $color="#9074f2">Link-in-bio</SoftwareBadge>
                    </SoftwareBadgeRow>
                    <SoftwareTitle>nev.so/@you</SoftwareTitle>
                    <SoftwareDesc>Custom profile pages with social links, posts, and personalization.</SoftwareDesc>
                  </SoftwareCardContent>
                  <SoftwareCardScanlines />
                </SoftwareCard>

                {/* Netvulo */}
                <SoftwareCard $size="medium" $accent="#22c55e" href="https://github.com/Nevvulo/netvulo" target="_blank">
                  <SoftwareCardGlow $color="#22c55e" />
                  <SoftwareCardContent>
                    <SoftwareIcon $color="#22c55e">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </SoftwareIcon>
                    <SoftwareBadgeRow>
                      <SoftwareBadge $color="#22c55e">Framework</SoftwareBadge>
                      <SoftwareStatus $status="active">Active</SoftwareStatus>
                    </SoftwareBadgeRow>
                    <SoftwareTitle>Netvulo</SoftwareTitle>
                    <SoftwareDesc>Custom networking layer & event handler for real-time applications.</SoftwareDesc>
                  </SoftwareCardContent>
                  <SoftwareCardScanlines />
                </SoftwareCard>

                {/* Continuous - Course Builder */}
                <SoftwareCard $size="small" $accent="#ec4899" href="https://github.com/Nevvulo/continuous" target="_blank">
                  <SoftwareCardGlow $color="#ec4899" />
                  <SoftwareCardContent>
                    <SoftwareIcon $color="#ec4899">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        <path d="M8 7h8M8 11h8M8 15h5" />
                      </svg>
                    </SoftwareIcon>
                    <SoftwareBadgeRow>
                      <SoftwareBadge $color="#ec4899">E-Learning</SoftwareBadge>
                      <SoftwareStatus $status="beta">WIP</SoftwareStatus>
                    </SoftwareBadgeRow>
                    <SoftwareTitle>Continuous</SoftwareTitle>
                    <SoftwareDesc>Cross-platform course builder app</SoftwareDesc>
                  </SoftwareCardContent>
                  <SoftwareCardScanlines />
                </SoftwareCard>

                {/* GYST - Coming Soon */}
                <SoftwareCard $size="small" $accent="#f59e0b" $comingSoon>
                  <SoftwareCardGlow $color="#f59e0b" />
                  <SoftwareCardContent>
                    <SoftwareIcon $color="#f59e0b">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    </SoftwareIcon>
                    <SoftwareBadgeRow>
                      <SoftwareBadge $color="#f59e0b">Productivity</SoftwareBadge>
                      <SoftwareStatus $status="soon">Idea</SoftwareStatus>
                    </SoftwareBadgeRow>
                    <SoftwareTitle>GYST</SoftwareTitle>
                    <SoftwareDesc>Get Your Shit Together - the organizer</SoftwareDesc>
                  </SoftwareCardContent>
                  <SoftwareCardScanlines />
                </SoftwareCard>
              </SoftwareGrid>
            </SoftwareSectionContent>
          </Section>

          {/* Work History Section */}
          <Section>
            <WorkSectionContent>
              <SectionHeader>
                <SectionTitle>
                  <SectionTitlePrimary>work</SectionTitlePrimary>
                  <SectionTitleSecondary>history</SectionTitleSecondary>
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
                <SupportTitle>support nevulo</SupportTitle>
                <SupportSubtitle>
                  Get exclusive perks, early access, and help support my work
                </SupportSubtitle>
              </SupportHeader>

              <SupportTiers>
                <SupportTierCard href="/support" $featured>
                  <TierBadge $tier="legend">Super Legend</TierBadge>
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
            <meta property="og:url" content="https://nev.so" />
            <meta property="og:site_name" content="Blake's Portfolio" />
            <meta
              property="og:image"
              content="https://nev.so/api/og"
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

const SoftwareCard = styled.a<{ $size: "featured" | "medium" | "small"; $accent: string; $comingSoon?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(20, 15, 35, 0.9) 0%, rgba(30, 25, 50, 0.8) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${(props) => props.$accent}30;
  text-decoration: none;
  color: ${(props) => props.theme.contrast};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: ${(props) => (props.$comingSoon ? "default" : "pointer")};

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
    padding: 1rem;
  }
`;

const SoftwareCardGlow = styled.div<{ $color: string }>`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, ${(props) => props.$color}08 0%, transparent 50%);
  pointer-events: none;
`;

const SoftwareCardContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SoftwareIcon = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: ${(props) => props.$color}15;
  border: 1px solid ${(props) => props.$color}30;
  border-radius: 14px;
  color: ${(props) => props.$color};
  margin-bottom: 1rem;
  box-shadow: 0 0 20px ${(props) => props.$color}10;
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

// Games section styles
const GamesSectionContent = styled.div`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 450px; /* Prevent CLS */
`;

const GamesCardsRow = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GolfquestCard = styled(Link)`
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(30, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 77, 193, 0.25);
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.25);
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(30, 25, 45, 0.85);
  }
`;

const GolfquestImageWrapper = styled.div`
  position: relative;
  height: 140px;
  background: linear-gradient(135deg, #065f46, #047857);
`;

const GolfquestOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(6, 95, 70, 0.3), rgba(4, 120, 87, 0.2));
`;

const GolfquestContent = styled.div`
  padding: 1rem;
`;

const GolfquestBadges = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const GolfquestBadge = styled.span`
  display: inline-flex;
  padding: 3px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
`;

const GolfquestPlatform = styled.span`
  display: inline-flex;
  padding: 3px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
  background: ${(props) => props.theme.contrast}08;
  color: ${(props) => props.theme.contrast}70;
`;

const GolfquestTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 1.125rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.25rem 0;
`;

const GolfquestDesc = styled.p`
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: ${(props) => props.theme.contrast}70;
  margin: 0;
  line-height: 1.4;
`;

const SecretGameCard = styled.div`
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(30, 25, 45, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px dashed rgba(168, 85, 247, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

const SecretGameContent = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 1.5rem;
`;

const SecretGameIcon = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
  border: 2px dashed rgba(168, 85, 247, 0.3);
  border-radius: 12px;
`;

const SecretGameBadge = styled.span`
  display: inline-flex;
  padding: 3px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  margin-bottom: 0.5rem;
`;

const SecretGameTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.25rem 0;
`;

const SecretGameDesc = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #a855f7;
  margin: 0;
  opacity: 0.8;
`;

const SecretGameGlow = styled.div`
  position: absolute;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

const GamesArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GameArticleCard = styled(Link)`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(30, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 77, 193, 0.2);
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
    border-color: rgba(79, 77, 193, 0.4);
    background: rgba(30, 25, 45, 0.85);
  }
`;

const GameArticleThumbnail = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #065f46, #047857);
  overflow: hidden;
`;

const GameArticlePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2));
`;

const GameArticleOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.5) 100%);
`;

const GameArticleContent = styled.div`
  padding: 0.75rem;
`;

const GameArticleLabel = styled.span`
  display: inline-flex;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 3px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  margin-bottom: 0.375rem;
`;

const GameArticleTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
`;

// Live section styles
const LiveSectionContent = styled.div`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 500px; /* Prevent CLS */
`;

const LiveEmbeds = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const LiveEmbedCard = styled.a<{ $isLive?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: ${(props) =>
    props.$isLive
      ? "linear-gradient(135deg, rgba(145, 70, 255, 0.25) 0%, rgba(30, 25, 45, 0.8) 100%)"
      : "rgba(30, 25, 45, 0.7)"};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${(props) =>
    props.$isLive ? "rgba(145, 70, 255, 0.4)" : "rgba(79, 77, 193, 0.25)"};
  border-radius: 12px;
  text-decoration: none;
  color: ${(props) => props.theme.contrast};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    background: ${(props) =>
      props.$isLive
        ? "linear-gradient(135deg, rgba(145, 70, 255, 0.3) 0%, rgba(30, 25, 45, 0.9) 100%)"
        : "rgba(30, 25, 45, 0.85)"};
    border-color: ${(props) =>
      props.$isLive ? "rgba(145, 70, 255, 0.6)" : "rgba(79, 77, 193, 0.4)"};
  }
`;

const LiveBadge = styled.span`
  position: absolute;
  top: -8px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #ff0000;
  color: white;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(255, 0, 0, 0.4);
`;

const LivePulse = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: white;
  animation: livePulse 1.5s ease-in-out infinite;

  @keyframes livePulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.3);
    }
  }
`;

const LiveEmbedIcon = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: ${(props) => props.$color}20;
  border-radius: 10px;
  color: ${(props) => props.$color};
  flex-shrink: 0;
`;

const LiveEmbedContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const LiveEmbedTitle = styled.div`
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 2px;
`;

const LiveEmbedSubtitle = styled.div`
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  opacity: 0.6;
`;

const OnlineIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

const OnlineDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #43b581;
`;

// Video grid styles for Live section
const LiveVideosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  min-height: 160px; /* Prevent CLS */

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const LiveVideoCard = styled(Link)`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(30, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 77, 193, 0.2);
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
    background: rgba(30, 25, 45, 0.85);
    border-color: rgba(79, 77, 193, 0.4);
  }
`;

const LiveVideoThumbnail = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  background: #1a1a2e;
  overflow: hidden;
`;

const LiveVideoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(144, 116, 242, 0.2), rgba(99, 102, 241, 0.1));
`;

const LiveVideoPlayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;

  ${LiveVideoCard}:hover & {
    opacity: 1;
  }
`;

const LiveVideoPlayButton = styled.div`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(144, 116, 242, 0.9);
  border-radius: 50%;
  transition: transform 0.2s ease;

  ${LiveVideoCard}:hover & {
    transform: scale(1.1);
  }
`;

const LiveVideoInfo = styled.div`
  padding: 0.75rem;
`;

const LiveVideoTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.375rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
`;

const LiveVideoLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  text-transform: uppercase;
  padding: 2px 6px;
  background: ${(props) => props.theme.contrast}08;
  color: ${(props) => props.theme.contrast}60;
  border-radius: 3px;
`;

const LiveVideosEmpty = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: ${(props) => props.theme.contrast};
  opacity: 0.5;
  font-size: 0.875rem;
  background: rgba(30, 25, 45, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px dashed rgba(79, 77, 193, 0.3);
  border-radius: 12px;
`;

// Shorts Carousel styles
const ShortsSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ShortsSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ShortsSectionTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
`;

const ShortsNavButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ShortsNavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(30, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 77, 193, 0.25);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 25, 45, 0.9);
    border-color: rgba(79, 77, 193, 0.4);
  }
`;

const ShortsCarousel = styled.div`
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 0.25rem 0;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ShortCard = styled.div`
  flex-shrink: 0;
  width: 140px;
  aspect-ratio: 9 / 16;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(30, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 77, 193, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border-color: rgba(79, 77, 193, 0.4);
  }

  @media (max-width: 640px) {
    width: 120px;
  }
`;

const ShortThumbnail = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const ShortPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(144, 116, 242, 0.2), rgba(99, 102, 241, 0.1));
`;

const ShortOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%);
  padding: 0.75rem;
`;

const ShortPlayButton = styled.div`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(144, 116, 242, 0.9);
  border-radius: 50%;
  margin-bottom: auto;
  margin-top: auto;
  transition: transform 0.2s ease;

  ${ShortCard}:hover & {
    transform: scale(1.1);
  }
`;

const ShortTitle = styled.span`
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 500;
  color: white;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  margin-top: auto;
`;

const ShortEmbed = styled.div`
  width: 100%;
  height: 100%;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

// Stream-O-Meter and Events Calendar styles
const LiveTopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  min-height: 180px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StreamOMeterCard = styled.a<{ $isLive?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: ${(props) =>
    props.$isLive
      ? "linear-gradient(135deg, rgba(145, 70, 255, 0.2) 0%, rgba(30, 25, 45, 0.8) 100%)"
      : "rgba(30, 25, 45, 0.7)"};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${(props) =>
    props.$isLive ? "rgba(145, 70, 255, 0.3)" : "rgba(79, 77, 193, 0.25)"};
  border-radius: 14px;
  text-decoration: none;
  color: ${(props) => props.theme.contrast};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
    background: ${(props) =>
      props.$isLive
        ? "linear-gradient(135deg, rgba(145, 70, 255, 0.25) 0%, rgba(30, 25, 45, 0.9) 100%)"
        : "rgba(30, 25, 45, 0.85)"};
    border-color: ${(props) =>
      props.$isLive ? "rgba(145, 70, 255, 0.5)" : "rgba(79, 77, 193, 0.4)"};
  }
`;

const StreamOMeterHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9074f2;
  margin-bottom: 0.75rem;
`;

const StreamOMeterLabel = styled.div<{ $chance: number }>`
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props) =>
    props.$chance >= 80
      ? "#22c55e"
      : props.$chance >= 50
        ? "#eab308"
        : props.$chance >= 20
          ? "#f97316"
          : "#ef4444"};
  margin-bottom: 0.75rem;
`;

const StreamOMeterBar = styled.div`
  height: 16px;
  background: ${(props) => props.theme.contrast}08;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const StreamOMeterSegments = styled.div`
  display: flex;
  gap: 3px;
  height: 100%;
  padding: 2px;
`;

const segmentBounce = keyframes`
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(1.15);
  }
`;

const StreamOMeterSegment = styled.div<{ $active: boolean; $chance: number }>`
  flex: 1;
  height: 100%;
  border-radius: 4px;
  background: ${(props) =>
    props.$active
      ? (
          props.$chance >= 80
            ? "#22c55e"
            : props.$chance >= 50
              ? "#eab308"
              : props.$chance >= 20
                ? "#f97316"
                : "#ef4444"
        )
      : "rgba(255, 255, 255, 0.08)"};
  transition: background 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom;

  ${(props) =>
    props.$active &&
    `
    animation: segmentPulse 2s ease-in-out infinite;
    animation-delay: ${Math.random() * 0.5}s;
  `}

  @keyframes segmentPulse {
    0%, 100% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(1.1);
    }
  }
`;

const StreamOMeterValue = styled.div<{ $chance: number }>`
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) =>
    props.$chance >= 80
      ? "#22c55e"
      : props.$chance >= 50
        ? "#eab308"
        : props.$chance >= 20
          ? "#f97316"
          : "#ef4444"};
  opacity: 0.8;
`;

const StreamOMeterMessage = styled.div`
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: ${(props) => props.theme.contrast}60;
  margin-top: 0.5rem;
`;

const EventsCalendarCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: rgba(30, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 77, 193, 0.25);
  border-radius: 14px;
  min-height: 180px;
`;

const EventsCalendarHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => props.theme.contrast}60;
  margin-bottom: 1rem;
`;

const NoEventsState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: ${(props) => props.theme.contrast}40;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EventItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const EventDate = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  color: #9074f2;
  text-transform: uppercase;
`;

const EventName = styled.span`
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// Support section styles
const SupportSectionContent = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
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

const TierBadge = styled.span<{ $tier: string }>`
  display: inline-flex;
  padding: 0.375rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 20px;
  background: ${(props) =>
    props.$tier === "legend"
      ? "linear-gradient(135deg, #9074f2, #6366f1)"
      : "rgba(255, 255, 255, 0.1)"};
  color: white;
  margin-bottom: 1rem;
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
    content: "✓";
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
