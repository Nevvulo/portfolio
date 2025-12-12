import { memo, useState, useCallback } from "react";
import styled from "styled-components";
import type { MessageEmbed } from "../../../../types/lounge";
import { VideoEmbed } from "./VideoEmbed";
import { AudioEmbed } from "./AudioEmbed";
import { LinkEmbed } from "./LinkEmbed";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { ImageLightbox } from "./ImageLightbox";

interface MessageEmbedsProps {
  embeds: MessageEmbed[];
}

// Calculate display dimensions like Discord - max 400w, max 300h, maintain aspect ratio
function calcDisplaySize(w?: number, h?: number): { width: number; height: number } {
  const MAX_W = 400;
  const MAX_H = 300;
  const DEFAULT_W = 400;
  const DEFAULT_H = 225; // 16:9 fallback

  if (!w || !h) return { width: DEFAULT_W, height: DEFAULT_H };

  let displayW = w;
  let displayH = h;

  // Scale down to fit within max dimensions while preserving aspect ratio
  if (displayW > MAX_W) {
    displayH = (MAX_W / displayW) * displayH;
    displayW = MAX_W;
  }
  if (displayH > MAX_H) {
    displayW = (MAX_H / displayH) * displayW;
    displayH = MAX_H;
  }

  return { width: Math.round(displayW), height: Math.round(displayH) };
}

export const MessageEmbeds = memo(function MessageEmbeds({
  embeds,
}: MessageEmbedsProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleImageError = useCallback((index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  }, []);

  if (!embeds || embeds.length === 0) return null;

  // Separate images from other embed types
  const images = embeds.filter((e) => e.type === "image");
  const otherEmbeds = embeds.filter((e) => e.type !== "image");

  return (
    <EmbedsContainer>
      {/* Render each image with exact dimensions */}
      {images.map((image, index) => {
        if (failedImages.has(index)) return null;

        const { width, height } = calcDisplaySize(image.width, image.height);

        return (
          <ImageContainer
            key={index}
            style={{ width: `${width}px`, height: `${height}px` }}
            onClick={() => setLightboxIndex(index)}
          >
            <img
              src={image.url || ""}
              alt={image.filename || `Image ${index + 1}`}
              loading="eager"
              decoding="async"
              onError={() => handleImageError(index)}
            />
          </ImageContainer>
        );
      })}

      {/* Render other embeds normally */}
      {otherEmbeds.map((embed, index) => (
        <EmbedWrapper key={`other-${index}`}>
          {renderEmbed(embed)}
        </EmbedWrapper>
      ))}

      {/* Lightbox for full-size image viewing */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <ImageLightbox
          src={images[lightboxIndex].url || ""}
          alt={images[lightboxIndex].filename}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </EmbedsContainer>
  );
});

function renderEmbed(embed: MessageEmbed) {
  switch (embed.type) {
    case "video":
      return (
        <VideoEmbed
          url={embed.url || ""}
          thumbnail={embed.thumbnail}
          filename={embed.filename}
          width={embed.width}
          height={embed.height}
          mimeType={embed.mimeType}
        />
      );

    case "audio":
      return (
        <AudioEmbed
          url={embed.url || ""}
          filename={embed.filename}
          duration={embed.duration}
        />
      );

    case "youtube":
      return (
        <YouTubeEmbed
          url={embed.url || ""}
          embedUrl={embed.embedUrl}
          title={embed.title}
          thumbnail={embed.thumbnail}
        />
      );

    case "link":
    default:
      return (
        <LinkEmbed
          url={embed.url || ""}
          title={embed.title}
          description={embed.description}
          thumbnail={embed.thumbnail}
          siteName={embed.siteName}
        />
      );
  }
}

const EmbedsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const EmbedWrapper = styled.div`
  /* Individual embed wrapper for potential future styling */
`;

// Simple image container with exact pixel dimensions set via inline style
const ImageContainer = styled.div`
  position: relative;
  cursor: pointer;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  /* width and height set via inline style for exact CLS-free rendering */

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &:hover img {
    transform: scale(1.02);
    transition: transform 0.15s ease;
  }
`;
