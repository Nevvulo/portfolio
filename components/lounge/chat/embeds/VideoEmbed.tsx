import { memo } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../../constants/lounge";

interface VideoEmbedProps {
  url: string;
  thumbnail?: string;
  filename?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export const VideoEmbed = memo(function VideoEmbed({
  url,
  thumbnail,
  filename,
  width,
  height,
}: VideoEmbedProps) {
  // Calculate display dimensions (max 400x300, maintain aspect ratio)
  const displayDimensions = calculateDisplayDimensions(width, height);

  return (
    <VideoContainer $width={displayDimensions.width}>
      <StyledVideo
        controls
        preload="metadata"
        poster={thumbnail}
        $height={displayDimensions.height}
      >
        <source src={url} />
        Your browser does not support video playback.
      </StyledVideo>
      {filename && <Filename title={filename}>{filename}</Filename>}
    </VideoContainer>
  );
});

function calculateDisplayDimensions(
  width?: number,
  height?: number
): { width: number; height: number } {
  const maxWidth = 400;
  const maxHeight = 300;

  if (!width || !height) {
    // Default 16:9 aspect ratio
    return { width: maxWidth, height: 225 };
  }

  const aspectRatio = width / height;

  let displayWidth = width;
  let displayHeight = height;

  // Scale down if exceeds max dimensions
  if (displayWidth > maxWidth) {
    displayWidth = maxWidth;
    displayHeight = displayWidth / aspectRatio;
  }

  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = displayHeight * aspectRatio;
  }

  return {
    width: Math.round(displayWidth),
    height: Math.round(displayHeight),
  };
}

const VideoContainer = styled.div<{ $width: number }>`
  width: ${(p) => p.$width}px;
  max-width: 100%;
  margin-top: 0.5rem;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
`;

const StyledVideo = styled.video<{ $height: number }>`
  width: 100%;
  height: ${(p) => p.$height}px;
  display: block;
  background: #000;

  &::-webkit-media-controls-panel {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  }

  &::-webkit-media-controls-play-button,
  &::-webkit-media-controls-volume-slider {
    filter: brightness(1.2);
  }
`;

const Filename = styled.div`
  padding: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  background: ${LOUNGE_COLORS.glassBackground};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
