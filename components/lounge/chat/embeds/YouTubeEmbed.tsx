import { Play } from "lucide-react";
import Image from "next/image";
import { memo, useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../../constants/lounge";

interface YouTubeEmbedProps {
  url: string;
  embedUrl?: string;
  title?: string;
  thumbnail?: string;
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
    /youtube\.com\/shorts\/([^&?/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

export const YouTubeEmbed = memo(function YouTubeEmbed({
  url,
  embedUrl,
  title,
  thumbnail,
}: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Get video ID for embed
  const videoId = extractVideoId(url);
  const embedSrc = embedUrl || (videoId ? `https://www.youtube.com/embed/${videoId}` : null);

  // Generate thumbnail URL if not provided
  const thumbnailUrl =
    thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

  if (!embedSrc || !videoId) {
    // Fallback to simple link if we can't extract video ID
    return (
      <FallbackLink href={url} target="_blank" rel="noopener noreferrer">
        YouTube Video
      </FallbackLink>
    );
  }

  // Lazy load: show thumbnail first, load iframe on click
  if (!isLoaded) {
    return (
      <ThumbnailContainer onClick={() => setIsLoaded(true)}>
        {thumbnailUrl && (
          <ThumbnailImage
            src={thumbnailUrl}
            alt={title || "YouTube video"}
            fill
            sizes="400px"
            unoptimized
          />
        )}
        <PlayOverlay>
          <PlayButton>
            <Play size={32} />
          </PlayButton>
        </PlayOverlay>
        {title && <VideoTitle>{title}</VideoTitle>}
        <YouTubeBadge>YouTube</YouTubeBadge>
      </ThumbnailContainer>
    );
  }

  return (
    <IframeContainer>
      <StyledIframe
        src={`${embedSrc}?autoplay=1`}
        title={title || "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </IframeContainer>
  );
});

const ThumbnailContainer = styled.div`
  position: relative;
  width: 400px;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  margin-top: 0.5rem;
  background: #000;

  &:hover {
    .play-button {
      transform: scale(1.1);
    }
  }
`;

const ThumbnailImage = styled(Image)`
  object-fit: cover;
`;

const PlayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: background 0.2s;

  ${ThumbnailContainer}:hover & {
    background: rgba(0, 0, 0, 0.4);
  }
`;

const PlayButton = styled.div.attrs({ className: "play-button" })`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 48px;
  background: #ff0000;
  border-radius: 12px;
  color: #fff;
  transition: transform 0.2s;

  svg {
    margin-left: 4px;
  }
`;

const VideoTitle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.75rem;
  padding-top: 2rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  font-size: 0.85rem;
  color: #fff;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const YouTubeBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const IframeContainer = styled.div`
  width: 400px;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 0.5rem;
  background: #000;
`;

const StyledIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const FallbackLink = styled.a`
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 4px;
  color: ${LOUNGE_COLORS.tier1};
  text-decoration: none;
  font-size: 0.9rem;

  &:hover {
    background: rgba(255, 0, 0, 0.15);
  }
`;
