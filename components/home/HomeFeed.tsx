import { faClock, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import styled from "styled-components";
import { BadgeType } from "../../constants/badges";
import type { BentoCardProps } from "../learn/BentoCard";
import { SupporterBadge } from "../badges/supporter-badge";
import { SkeletonImage } from "../blog/skeleton-image";
import { Label } from "../blog/labels";

interface HomeFeedProps {
  posts: BentoCardProps[];
}

export function HomeFeed({ posts }: HomeFeedProps) {
  if (posts.length === 0) {
    return (
      <EmptyState>
        <EmptyTitle>No posts yet</EmptyTitle>
        <EmptyDescription>Check back soon for new content!</EmptyDescription>
      </EmptyState>
    );
  }

  return (
    <FeedGrid>
      {posts.map((post) => (
        <HomeFeedCard key={post.id} post={post} />
      ))}
    </FeedGrid>
  );
}

function HomeFeedCard({ post }: { post: BentoCardProps }) {
  const { slug, title, description, coverImage, contentType, youtubeId, labels, readTimeMins, visibility } = post;
  const isVideo = contentType === "video";
  const thumbnail = isVideo && youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    : coverImage;
  const isTierLocked = visibility === "tier1" || visibility === "tier2";

  return (
    <CardLink href={`/learn/${slug}`} prefetch={false}>
      <Card>
        {isTierLocked && (
          <TierBadgeWrapper>
            <SupporterBadge
              type={visibility === "tier2" ? BadgeType.SUPER_LEGEND_2 : BadgeType.SUPER_LEGEND}
              size="small"
              showLabel
            />
          </TierBadgeWrapper>
        )}
        <ImageContainer>
          {thumbnail && (
            <SkeletonImage
              alt={title}
              fill
              style={{ objectFit: "cover" }}
              src={thumbnail}
            />
          )}
          {isVideo && (
            <PlayButton>
              <FontAwesomeIcon icon={faPlay} />
            </PlayButton>
          )}
          <ImageOverlay />
        </ImageContainer>
        <CardContent>
          <CardTitle>{title}</CardTitle>
          <CardDesc>{description}</CardDesc>
          <CardMeta>
            {labels[0] && <Label>{labels[0].replace(/-/g, " ")}</Label>}
            {readTimeMins && (
              <ReadTime>
                <FontAwesomeIcon icon={faClock} size="xs" /> {readTimeMins} min
              </ReadTime>
            )}
          </CardMeta>
        </CardContent>
      </Card>
    </CardLink>
  );
}


const FeedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 0 48px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    padding: 0 16px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const CardLink = styled(Link)`
  text-decoration: none;
  display: block;
`;

const Card = styled.div`
  position: relative;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(144, 116, 242, 0.4);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
`;

const ImageOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.3) 100%);
`;

const PlayButton = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;
  transition: all 0.2s ease;

  ${Card}:hover & {
    background: rgba(144, 116, 242, 0.9);
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

const CardContent = styled.div`
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  line-height: 1.3;
  font-family: var(--font-sans);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardDesc = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${(props) => props.theme.postDescriptionText};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
`;

const ReadTime = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const TierBadgeWrapper = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 48px;
  text-align: center;
`;

const EmptyTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 20px;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
`;

export function HomeFeedSkeleton() {
  return (
    <FeedGrid>
      {[...Array(6)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </FeedGrid>
  );
}

const SkeletonCard = styled.div`
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;

  &::before {
    content: "";
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: rgba(255, 255, 255, 0.05);
  }

  &::after {
    content: "";
    display: block;
    height: 80px;
    margin: 14px 16px 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
  }

  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;
