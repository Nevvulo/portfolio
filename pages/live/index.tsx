import { useQuery } from "convex/react";
import { ExternalLink, Play } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Script from "next/script";
import styled from "styled-components";
import { SimpleNavbar } from "../../components/navbar/simple";
import { api } from "../../convex/_generated/api";
import type { DiscordWidget } from "../../types/discord";
import { fetchDiscordWidget } from "../../utils/discord-widget";
import { checkTwitchLiveStatus } from "../../utils/twitch";

interface LivePageProps {
  discordWidget: DiscordWidget | null;
  isLive: boolean;
}

export default function LivePage({ discordWidget, isLive }: LivePageProps) {
  const router = useRouter();

  // Allow ?mockLive=true to simulate live state for testing
  const mockLive = router.query.mockLive === "true";
  const effectiveIsLive = mockLive || isLive;

  // Get video posts (YouTube content)
  const posts = useQuery(api.blogPosts.getForBento, { excludeNews: true });

  // Filter to only video content
  const videoPosts = posts?.filter((p) => p.contentType === "video") ?? [];

  const onlineCount = discordWidget?.presence_count || 0;

  return (
    <PageWrapper>
      <Background />
      <SimpleNavbar />

      <MainContent>
        <PageHeader>
          <HeaderTitle>live</HeaderTitle>
          <HeaderDescription>Watch streams, videos, and clips from my channel</HeaderDescription>
        </PageHeader>

        {/* Full Width Embeds Section */}
        <EmbedsWrapper>
          <TwitchEmbedContainer $isLive={effectiveIsLive}>
            {effectiveIsLive && (
              <LiveIndicator>
                <LivePulse />
                LIVE{mockLive && " (mock)"}
              </LiveIndicator>
            )}
            <div id="twitch-embed" />
          </TwitchEmbedContainer>
          <DiscordWidgetContainer>
            <DiscordWidget
              src="https://discord.com/widget?id=363516708062756886&theme=dark"
              width="100%"
              height="100%"
              allowTransparency={true}
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            />
          </DiscordWidgetContainer>
        </EmbedsWrapper>

        {/* Quick Links */}
        <QuickLinksSection>
          <QuickLinkCard href="https://twitch.tv/Nevvulo" target="_blank" rel="noopener noreferrer">
            <QuickLinkIcon $color="#9146ff">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
            </QuickLinkIcon>
            <QuickLinkText>Open in Twitch</QuickLinkText>
            <ExternalLink size={14} style={{ opacity: 0.5 }} />
          </QuickLinkCard>
          <QuickLinkCard href="https://discord.gg/nevulo" target="_blank" rel="noopener noreferrer">
            <QuickLinkIcon $color="#5865f2">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </QuickLinkIcon>
            <QuickLinkText>
              {onlineCount > 0 ? `${onlineCount} online` : "Join Discord"}
            </QuickLinkText>
            <ExternalLink size={14} style={{ opacity: 0.5 }} />
          </QuickLinkCard>
        </QuickLinksSection>

        {/* Videos Section */}
        <SectionTitle>Recent Videos</SectionTitle>

        {videoPosts.length === 0 ? (
          <EmptyState>
            <Play size={48} />
            <p>No videos yet</p>
            <p>Check back soon for new content!</p>
          </EmptyState>
        ) : (
          <VideosGrid>
            {videoPosts.map((video) => (
              <VideoCard key={video._id} href={`/learn/${video.slug}`}>
                <VideoThumbnail>
                  {video.coverImage ? (
                    <Image
                      src={video.coverImage}
                      alt={video.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : video.youtubeId ? (
                    <Image
                      src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                      alt={video.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <PlaceholderThumbnail />
                  )}
                  <PlayOverlay>
                    <PlayButton>
                      <Play size={24} fill="white" />
                    </PlayButton>
                  </PlayOverlay>
                  {video.readTimeMins && (
                    <DurationBadge>
                      {video.readTimeMins < 60
                        ? `${video.readTimeMins}:00`
                        : `${Math.floor(video.readTimeMins / 60)}:${String(video.readTimeMins % 60).padStart(2, "0")}:00`}
                    </DurationBadge>
                  )}
                </VideoThumbnail>
                <VideoInfo>
                  <VideoTitle>{video.title}</VideoTitle>
                  {video.description && <VideoDescription>{video.description}</VideoDescription>}
                  <VideoMeta>
                    {video.labels.map((label) => (
                      <VideoLabel key={label}>{label}</VideoLabel>
                    ))}
                  </VideoMeta>
                </VideoInfo>
              </VideoCard>
            ))}
          </VideosGrid>
        )}

        {/* YouTube Channel Link */}
        <YouTubeLink href="https://youtube.com/@Nevvulo" target="_blank">
          <YouTubeLinkText>
            View all videos on YouTube
            <ExternalLink size={14} />
          </YouTubeLinkText>
        </YouTubeLink>
      </MainContent>

      <Script
        src="https://embed.twitch.tv/embed/v1.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-expect-error
          if (window.Twitch) {
            const embedContainer = document.getElementById("twitch-embed");
            if (embedContainer) {
              const width = embedContainer.offsetWidth;
              const height = embedContainer.offsetHeight;

              // @ts-expect-error
              new window.Twitch.Embed("twitch-embed", {
                width: width,
                height: height,
                channel: "Nevvulo",
                parent: ["nevulo.xyz", "nev.so", "localhost"],
                theme: "dark",
                layout: "video-with-chat",
              });
            }
          }
        }}
      />

      <Head key="live">
        <title>nevulo - Live</title>
        <meta
          name="description"
          content="Watch streams, videos, and clips from Nevulo. Catch live streams on Twitch and past videos on YouTube."
        />
        <meta property="og:title" content="nevulo - Live" />
        <meta property="og:description" content="Watch streams, videos, and clips from Nevulo." />
        <meta property="og:url" content="https://nev.so/live" />
        <meta property="og:site_name" content="nevulo" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Live&subtitle=Streams%20and%20Content"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="nevulo - Live" />
        <meta name="twitter:description" content="Watch streams, videos, and clips from Nevulo." />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Live&subtitle=Streams%20and%20Content"
        />
      </Head>
    </PageWrapper>
  );
}

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
    revalidate: 60,
  };
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
  background: linear-gradient(180deg, rgba(144, 116, 242, 0.02) 0%, rgba(59, 130, 246, 0.02) 100%);
  height: 100%;
  z-index: -1;
  position: fixed;
  top: 0;
  left: 0;
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem 3rem;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const HeaderTitle = styled.h1`
  font-size: 64px;
  font-weight: 900;
  color: ${(props) => props.theme.contrast};
  font-family: 'Protest Revolution', cursive;
  letter-spacing: 2px;
  transform: rotate(-3deg);
  margin: 0;

  @media (max-width: 768px) {
    font-size: 48px;
  }
`;

const HeaderDescription = styled.p`
  font-size: 16px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
  margin: 0.5rem 0 0 0;
`;

// Full Width Embeds
const EmbedsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 1.5rem;
  margin-bottom: 2rem;
  min-height: 500px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`;

const TwitchEmbedContainer = styled.div<{ $isLive?: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(30, 25, 45, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${(props) => (props.$isLive ? "rgba(145, 70, 255, 0.4)" : "rgba(79, 77, 193, 0.3)")};
  box-shadow: 0 20px 60px rgba(79, 77, 193, 0.2);

  #twitch-embed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  iframe {
    border-radius: 16px;
  }

  @media (max-width: 1100px) {
    aspect-ratio: 16 / 9;
    min-height: 300px;
  }
`;

const LiveIndicator = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #ff0000;
  color: white;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.4);
`;

const LivePulse = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }
`;

const DiscordWidgetContainer = styled.div`
  border-radius: 16px;
  overflow: hidden;
  background: rgba(30, 25, 45, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 77, 193, 0.3);
  box-shadow: 0 20px 60px rgba(79, 77, 193, 0.2);
  min-height: 500px;

  @media (max-width: 1100px) {
    min-height: 400px;
  }
`;

const DiscordWidget = styled.iframe`
  border: none;
  width: 100%;
  height: 100%;
  min-height: 500px;

  @media (max-width: 1100px) {
    min-height: 400px;
  }
`;

// Quick Links
const QuickLinksSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const QuickLinkCard = styled.a`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: rgba(30, 25, 45, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 77, 193, 0.25);
  border-radius: 12px;
  text-decoration: none;
  color: ${(props) => props.theme.contrast};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    background: rgba(30, 25, 45, 0.85);
    border-color: rgba(79, 77, 193, 0.4);
  }
`;

const QuickLinkIcon = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: ${(props) => props.$color}20;
  border-radius: 8px;
  color: ${(props) => props.$color};
  flex-shrink: 0;
`;

const QuickLinkText = styled.span`
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  flex: 1;
`;

const SectionTitle = styled.h2`
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 1.25rem 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
  text-align: center;
  background: rgba(30, 25, 45, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 77, 193, 0.2);
  border-radius: 16px;

  svg {
    margin-bottom: 1rem;
  }

  p {
    margin: 0.25rem 0;
  }
`;

const VideosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const VideoCard = styled(Link)`
  display: flex;
  flex-direction: column;
  border-radius: 14px;
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

const VideoThumbnail = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  background: #1a1a2e;
`;

const PlaceholderThumbnail = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(144, 116, 242, 0.2), rgba(99, 102, 241, 0.1));
`;

const PlayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;

  ${VideoCard}:hover & {
    opacity: 1;
  }
`;

const PlayButton = styled.div`
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(144, 116, 242, 0.9);
  border-radius: 50%;
  transition: transform 0.2s ease;

  ${VideoCard}:hover & {
    transform: scale(1.1);
  }
`;

const DurationBadge = styled.span`
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: white;
`;

const VideoInfo = styled.div`
  padding: 1rem;
`;

const VideoTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const VideoDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: ${(props) => props.theme.contrast};
  opacity: 0.7;
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const VideoMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const VideoLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  padding: 2px 8px;
  background: rgba(79, 77, 193, 0.15);
  color: rgba(165, 163, 232, 0.9);
  border-radius: 4px;
`;

const YouTubeLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 3rem;
  padding: 1rem;
  text-decoration: none;
`;

const YouTubeLinkText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 13px;
  color: ${(props) => props.theme.contrast};
  opacity: 0.6;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;
