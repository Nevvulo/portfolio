import Head from "next/head";
import Script from "next/script";
import styled from "styled-components";
import { TopNavView } from "../components/layout/topnav";
import { SimpleNavbar } from "../components/navbar/simple";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitch } from "@fortawesome/free-brands-svg-icons";
import Image from "next/image";
import TwitchLogo from "../assets/svg/twitch.svg";

const Background = styled.div`
  width: 100%;
  filter: ${(props) => (props.theme.contrast === "#000" ? "invert(1)" : "")};
  background: linear-gradient(135deg, rgba(79, 77, 193, 0.03) 0%, rgba(107, 105, 214, 0.05) 100%);
  height: 100%;
  z-index: -1;
  position: fixed;
  top: 0;
`;

const LiveHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 0 1.5rem 0;

  @media (max-width: 768px) {
    gap: 0.75rem;
    padding: 0.5rem 0 1rem 0;
  }
`;

const LiveText = styled.span`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: ${(props) => props.theme.contrast};

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const TwitchIcon = styled(FontAwesomeIcon)`
  width: 28px;
  height: 28px;
  color: #9146ff;

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
  }
`;

const TwitchLogoWrapper = styled.div`
  width: 120px;
  height: auto;
  display: flex;
  align-items: center;

  svg {
    width: 100%;
    height: auto;
  }

  @media (max-width: 768px) {
    width: 90px;
  }
`;

const LiveContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0rem 1rem 3rem 1rem;
  width: 100%;
  min-height: calc(100vh - 100px);

  @media (max-width: 768px) {
    padding: 1rem 0.5rem 3rem 0.5rem;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-width: 1400px;

  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: center;
  }
`;

const EmbedWrapper = styled.div`
  width: 100%;
  max-width: 900px;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(79, 77, 193, 0.3);
  background: rgba(0, 0, 0, 0.5);
  position: relative;
  flex-shrink: 0;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  @media (max-width: 1200px) {
    max-width: 100%;
  }

  @media (max-width: 768px) {
    aspect-ratio: 16 / 9;
    border-radius: 8px;
  }
`;

const DiscordWidget = styled.iframe`
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(79, 77, 193, 0.3);
  border: none;
  flex-shrink: 0;

  @media (max-width: 768px) {
    border-radius: 8px;
    width: 100% !important;
    max-width: 350px;
  }
`;

export default function LivePage() {
  return (
    <TopNavView>
      <Background />
      <SimpleNavbar backRoute="/" />

      <LiveContainer>
        <LiveHeader>
          <TwitchIcon icon={faTwitch} />
          <LiveText>LIVE ON</LiveText>
          <TwitchLogoWrapper>
            <Image src={TwitchLogo} alt="Twitch" />
          </TwitchLogoWrapper>
        </LiveHeader>
        <ContentWrapper>
          <EmbedWrapper>
            <div id="twitch-embed" />
          </EmbedWrapper>
          <DiscordWidget
            src="https://discord.com/widget?id=363516708062756886&theme=dark"
            width="350"
            height="500"
            allowTransparency={true}
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          />
        </ContentWrapper>
      </LiveContainer>

      <Script
        src="https://embed.twitch.tv/embed/v1.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore
          if (window.Twitch) {
            const embedContainer = document.getElementById("twitch-embed");
            if (embedContainer) {
              const width = embedContainer.offsetWidth;
              const height = embedContainer.offsetHeight;

              // @ts-ignore
              new window.Twitch.Embed("twitch-embed", {
                width: width,
                height: height,
                channel: "Nevvulo",
                parent: ["nevulo.xyz", "nev.so", "localhost"],
                theme: "dark",
                layout: "video",
              });
            }
          }
        }}
      />

      <Head key="live">
        <title>Live Stream - Nevulo</title>
        <meta
          name="description"
          content="Watch Nevulo live on Twitch. Streaming software development, gaming, and more."
        />
        <meta property="og:title" content="Nevulo Live on Twitch" />
        <meta
          property="og:description"
          content="Watch Nevulo live on Twitch. Streaming software development, gaming, and more."
        />
        <meta property="og:url" content="https://nev.so/live" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Live%20Stream&subtitle=Watch%20me%20live%20on%20Twitch"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Nevulo Live on Twitch" />
        <meta
          name="twitter:description"
          content="Watch Nevulo live streaming on Twitch."
        />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Live%20Stream&subtitle=Watch%20me%20live%20on%20Twitch"
        />
      </Head>
    </TopNavView>
  );
}
