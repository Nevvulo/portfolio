import Image from "next/image";
import { memo, useState } from "react";
import styled from "styled-components";
import { ImageLightbox } from "./ImageLightbox";

interface ImageAttachmentProps {
  url: string;
  filename?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

// Generate a simple blur placeholder (1x1 pixel in the theme color)
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";

export const ImageAttachment = memo(function ImageAttachment({
  url,
  filename,
  width,
  height,
  mimeType,
}: ImageAttachmentProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [error, setError] = useState(false);

  // Check if it's a GIF
  const isGif = mimeType === "image/gif" || url.toLowerCase().endsWith(".gif");

  // Calculate display dimensions (max 400x300, maintain aspect ratio)
  const displayDimensions = calculateDisplayDimensions(width, height);

  if (error) {
    return (
      <ErrorContainer>
        <ErrorText>Failed to load image</ErrorText>
        {filename && <Filename>{filename}</Filename>}
      </ErrorContainer>
    );
  }

  return (
    <>
      <ImageContainer
        onClick={() => setShowLightbox(true)}
        $width={displayDimensions.width}
        $height={displayDimensions.height}
        $loaded={isLoaded}
      >
        <StyledImage
          src={url}
          alt={filename || "Image attachment"}
          width={displayDimensions.width}
          height={displayDimensions.height}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          unoptimized={isGif} // Preserve GIF animations
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          $loaded={isLoaded}
        />
      </ImageContainer>

      {showLightbox && (
        <ImageLightbox src={url} alt={filename} onClose={() => setShowLightbox(false)} />
      )}
    </>
  );
});

function calculateDisplayDimensions(
  width?: number,
  height?: number,
): { width: number; height: number } {
  const maxWidth = 400;
  const maxHeight = 300;

  if (!width || !height) {
    // Default dimensions if unknown
    return { width: maxWidth, height: 200 };
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

const ImageContainer = styled.div<{
  $width: number;
  $height: number;
  $loaded: boolean;
}>`
  position: relative;
  width: ${(p) => p.$width}px;
  height: ${(p) => p.$height}px;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.2);
  margin-top: 0.5rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.95;
  }
`;

const StyledImage = styled(Image)<{ $loaded: boolean }>`
  object-fit: contain;
  transition: filter 0.3s ease;
  filter: ${(p) => (p.$loaded ? "blur(0)" : "blur(10px)")};
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 100px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-top: 0.5rem;
`;

const ErrorText = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

const Filename = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 0.25rem;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
