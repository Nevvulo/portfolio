import { ExternalLink } from "lucide-react";
import { memo } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../../constants/lounge";

interface LinkEmbedProps {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  siteName?: string;
}

export const LinkEmbed = memo(function LinkEmbed({
  url,
  title,
  description,
  thumbnail,
  siteName,
}: LinkEmbedProps) {
  // Extract domain from URL for display
  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return siteName || "Link";
    }
  })();

  const displayTitle = title || domain;
  const displaySiteName = siteName || domain;

  return (
    <EmbedContainer href={url} target="_blank" rel="noopener noreferrer">
      {thumbnail && (
        <Thumbnail>
          <ThumbnailImage src={thumbnail} alt="" />
        </Thumbnail>
      )}
      <Content $hasThumbnail={!!thumbnail}>
        <SiteName>{displaySiteName}</SiteName>
        <Title>
          {displayTitle}
          <ExternalLink size={12} />
        </Title>
        {description && <Description>{description}</Description>}
      </Content>
    </EmbedContainer>
  );
});

const EmbedContainer = styled.a`
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-left: 4px solid ${LOUNGE_COLORS.tier1};
  border-radius: 4px;
  margin-top: 0.5rem;
  max-width: 400px;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
  }
`;

const Thumbnail = styled.div`
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Content = styled.div<{ $hasThumbnail: boolean }>`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
`;

const SiteName = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const Title = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${LOUNGE_COLORS.tier1};
  line-height: 1.3;

  svg {
    flex-shrink: 0;
    opacity: 0.7;
  }
`;

const Description = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
