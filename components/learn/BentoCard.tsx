import { faClock, faPlay, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BadgeType } from "../../constants/badges";
import { SupporterBadge } from "../badges/supporter-badge";
import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";
import { Label } from "../blog/labels";
import { SkeletonImage } from "../blog/skeleton-image";

// Types
type BentoSize = "small" | "medium" | "large" | "banner" | "featured";
type ContentType = "article" | "video" | "news";
type Difficulty = "beginner" | "intermediate" | "advanced";

type Visibility = "public" | "members" | "tier1" | "tier2";

export interface BentoCardProps {
  id: number;
  slug: string;
  title: string;
  description: string;
  contentType: ContentType;
  coverImage?: string;
  youtubeId?: string;
  labels: string[];
  difficulty?: Difficulty;
  readTimeMins?: number;
  bentoSize: BentoSize;
  viewCount: number;
  publishedAt?: Date | string | null;
  visibility?: Visibility;
  author?: {
    displayName: string;
    avatarUrl?: string;
  } | null;
}

export function BentoCard(props: BentoCardProps) {
  const {
    bentoSize,
    slug,
    title,
    description,
    coverImage,
    contentType,
    youtubeId,
    labels,
    difficulty,
    readTimeMins,
    publishedAt,
    visibility,
  } = props;
  const [isPlaying, setIsPlaying] = useState(false);
  const isTierLocked = visibility === "tier1" || visibility === "tier2";

  const isVideo = contentType === "video";
  const isNews = contentType === "news";
  const thumbnail =
    isVideo && youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : coverImage;

  const handleVideoClick = (e: React.MouseEvent) => {
    if (isVideo && youtubeId) {
      e.preventDefault();
      setIsPlaying(true);
    }
  };

  const handleCloseVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(false);
  };

  // News posts always use compact news card style
  if (isNews) {
    const newsDate = publishedAt ? new Date(publishedAt) : null;
    const isFeatured = bentoSize === "featured";
    return (
      <NewsWrapper href={`/learn/${slug}`} prefetch={false} $size={bentoSize}>
        <NewsCard $featured={isFeatured}>
          {isTierLocked && <TierBadge tier={visibility as "tier1" | "tier2"} small />}
          {thumbnail && (
            <NewsImage $size={bentoSize}>
              <SkeletonImage alt={title} fill style={{ objectFit: "cover" }} src={thumbnail} />
            </NewsImage>
          )}
          <NewsContent $hasImage={!!thumbnail}>
            <NewsTitle $size={bentoSize}>{title}</NewsTitle>
            <NewsDesc $size={bentoSize}>{description}</NewsDesc>
            {newsDate && (
              <NewsDate>
                {newsDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </NewsDate>
            )}
          </NewsContent>
        </NewsCard>
      </NewsWrapper>
    );
  }

  // Render based on size
  if (bentoSize === "featured") {
    return (
      <FeaturedWrapper href={`/learn/${slug}`} prefetch={false} onClick={handleVideoClick}>
        <FeaturedCard>
          {isTierLocked && <TierBadge tier={visibility as "tier1" | "tier2"} />}
          <FeaturedImage>
            {isPlaying && youtubeId ? (
              <>
                <VideoEmbed
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <CloseButton onClick={handleCloseVideo}>
                  <FontAwesomeIcon icon={faTimes} />
                </CloseButton>
              </>
            ) : (
              <>
                {thumbnail && (
                  <SkeletonImage
                    alt={title}
                    fill
                    style={{ objectFit: "cover" }}
                    src={thumbnail}
                    priority
                  />
                )}
                {isVideo && (
                  <PlayButton $large>
                    <FontAwesomeIcon icon={faPlay} size="2x" />
                  </PlayButton>
                )}
                <FeaturedGradient />
              </>
            )}
          </FeaturedImage>
          {!isPlaying && (
            <FeaturedContent>
              <FeaturedLabel>Featured</FeaturedLabel>
              <FeaturedTitle>{title}</FeaturedTitle>
              <FeaturedDesc>{description}</FeaturedDesc>
              <CardMeta>
                {difficulty && <DifficultyBadge $difficulty={difficulty}>{difficulty}</DifficultyBadge>}
                {labels[0] && <Label>{labels[0].replace(/-/g, " ")}</Label>}
                {readTimeMins && (
                  <ReadTime>
                    <FontAwesomeIcon icon={faClock} size="xs" /> {readTimeMins} min
                  </ReadTime>
                )}
              </CardMeta>
            </FeaturedContent>
          )}
        </FeaturedCard>
      </FeaturedWrapper>
    );
  }

  if (bentoSize === "large") {
    return (
      <LargeWrapper href={`/learn/${slug}`} prefetch={false} onClick={handleVideoClick}>
        <LargeCard>
          {isTierLocked && <TierBadge tier={visibility as "tier1" | "tier2"} />}
          {isPlaying && youtubeId ? (
            <>
              <VideoEmbed
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <CloseButton onClick={handleCloseVideo}>
                <FontAwesomeIcon icon={faTimes} />
              </CloseButton>
            </>
          ) : (
            <>
              <LargeImage>
                {thumbnail && (
                  <SkeletonImage alt={title} fill style={{ objectFit: "cover" }} src={thumbnail} />
                )}
                {isVideo && (
                  <PlayButton>
                    <FontAwesomeIcon icon={faPlay} />
                  </PlayButton>
                )}
              </LargeImage>
              <LargeContent>
                <CardTitle>{title}</CardTitle>
                <CardDesc>{description}</CardDesc>
                <CardMeta>
                  {difficulty && <DifficultyBadge $difficulty={difficulty}>{difficulty}</DifficultyBadge>}
                  {labels[0] && <Label>{labels[0].replace(/-/g, " ")}</Label>}
                  {readTimeMins && (
                    <ReadTime>
                      <FontAwesomeIcon icon={faClock} size="xs" /> {readTimeMins} min
                    </ReadTime>
                  )}
                </CardMeta>
              </LargeContent>
            </>
          )}
        </LargeCard>
      </LargeWrapper>
    );
  }

  if (bentoSize === "banner") {
    return (
      <BannerWrapper href={`/learn/${slug}`} prefetch={false} onClick={handleVideoClick}>
        <BannerCard>
          {isTierLocked && <TierBadge tier={visibility as "tier1" | "tier2"} />}
          {isPlaying && youtubeId ? (
            <>
              <VideoEmbed
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <CloseButton onClick={handleCloseVideo}>
                <FontAwesomeIcon icon={faTimes} />
              </CloseButton>
            </>
          ) : (
            <>
              <BannerImage>
                {thumbnail && (
                  <SkeletonImage alt={title} fill style={{ objectFit: "cover" }} src={thumbnail} />
                )}
                {isVideo && (
                  <PlayButton>
                    <FontAwesomeIcon icon={faPlay} />
                  </PlayButton>
                )}
              </BannerImage>
              <BannerContent>
                <CardTitle>{title}</CardTitle>
                <CardDesc>{description}</CardDesc>
                <CardMeta>
                  {difficulty && <DifficultyBadge $difficulty={difficulty}>{difficulty}</DifficultyBadge>}
                  {labels[0] && <Label>{labels[0].replace(/-/g, " ")}</Label>}
                  {readTimeMins && (
                    <ReadTime>
                      <FontAwesomeIcon icon={faClock} size="xs" /> {readTimeMins} min
                    </ReadTime>
                  )}
                </CardMeta>
              </BannerContent>
            </>
          )}
        </BannerCard>
      </BannerWrapper>
    );
  }

  if (bentoSize === "small") {
    return (
      <SmallWrapper href={`/learn/${slug}`} prefetch={false} onClick={handleVideoClick}>
        <SmallCard $isPlaying={isPlaying}>
          {isTierLocked && <TierBadge tier={visibility as "tier1" | "tier2"} small />}
          {isPlaying && youtubeId ? (
            <>
              <VideoEmbed
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <CloseButton onClick={handleCloseVideo}>
                <FontAwesomeIcon icon={faTimes} />
              </CloseButton>
            </>
          ) : (
            <>
              <SmallImage>
                {thumbnail && (
                  <SkeletonImage alt={title} fill style={{ objectFit: "cover" }} src={thumbnail} />
                )}
                {isVideo && (
                  <PlayButton $small>
                    <FontAwesomeIcon icon={faPlay} />
                  </PlayButton>
                )}
              </SmallImage>
              <SmallOverlay>
                <SmallOverlayContent>
                  <SmallMeta>
                    {difficulty && <SmallDifficultyBadge $difficulty={difficulty}>{difficulty}</SmallDifficultyBadge>}
                    {labels[0] && <SmallLabel>{labels[0].replace(/-/g, " ")}</SmallLabel>}
                  </SmallMeta>
                  <SmallTitle>{title}</SmallTitle>
                </SmallOverlayContent>
              </SmallOverlay>
            </>
          )}
        </SmallCard>
      </SmallWrapper>
    );
  }

  // Default: Medium card
  return (
    <MediumWrapper href={`/learn/${slug}`} prefetch={false} onClick={handleVideoClick}>
      <MediumCard>
        {isTierLocked && <TierBadge tier={visibility as "tier1" | "tier2"} />}
        {isPlaying && youtubeId ? (
          <>
            <VideoEmbed
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <CloseButton onClick={handleCloseVideo}>
              <FontAwesomeIcon icon={faTimes} />
            </CloseButton>
          </>
        ) : (
          <>
            <MediumImage>
              {thumbnail && (
                <SkeletonImage alt={title} fill style={{ objectFit: "cover" }} src={thumbnail} />
              )}
              {isVideo && (
                <PlayButton>
                  <FontAwesomeIcon icon={faPlay} />
                </PlayButton>
              )}
            </MediumImage>
            <MediumContent>
              <CardTitle $small>{title}</CardTitle>
              <CardDesc $clamp={2} $small>{description}</CardDesc>
              <MediumMeta>
                <MediumMetaRow>
                  {difficulty && <DifficultyBadge $difficulty={difficulty}>{difficulty}</DifficultyBadge>}
                  {labels[0] && <Label>{labels[0].replace(/-/g, " ")}</Label>}
                </MediumMetaRow>
                {readTimeMins && (
                  <ReadTime>
                    <FontAwesomeIcon icon={faClock} size="xs" /> {readTimeMins} min
                  </ReadTime>
                )}
              </MediumMeta>
            </MediumContent>
          </>
        )}
      </MediumCard>
    </MediumWrapper>
  );
}

// ========== VIDEO EMBED STYLES ==========
const VideoEmbed = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  z-index: 2;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  cursor: pointer;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

// ========== BASE STYLES ==========
const CardBase = styled.div`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  height: 100%;
  min-height: 0;

  &:hover {
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    border-color: rgba(144, 116, 242, 0.4);
  }
`;

// ========== GRID WRAPPERS (these are the grid items) ==========
const FeaturedWrapper = styled(Link)`
  text-decoration: none;
  display: block;
  grid-column: span 3;
  grid-row: span 2;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 1200px) {
    grid-column: span 2;
  }

  @media (max-width: 600px) {
    grid-column: span 1;
  }
`;

const LargeWrapper = styled(Link)`
  text-decoration: none;
  display: block;
  grid-column: span 2;
  grid-row: span 2;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 600px) {
    grid-column: span 1;
  }
`;

const BannerWrapper = styled(Link)`
  text-decoration: none;
  display: block;
  grid-column: span 3;
  grid-row: span 1;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 900px) {
    grid-column: span 2;
  }

  @media (max-width: 600px) {
    grid-column: span 1;
  }
`;

const MediumWrapper = styled(Link)`
  text-decoration: none;
  display: block;
  grid-column: span 2;
  grid-row: span 1;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 600px) {
    grid-column: span 1;
  }
`;

const SmallWrapper = styled(Link)`
  text-decoration: none;
  display: block;
  grid-column: span 1;
  grid-row: span 1;
  min-width: 0;
  overflow: hidden;
`;

// ========== NEWS (COMPACT - SIZE RESPONSIVE) ==========
const NewsWrapper = styled(Link)<{ $size: BentoSize }>`
  text-decoration: none;
  display: block;
  flex-shrink: 0;

  ${(p) => {
    switch (p.$size) {
      case "small":
        return "width: 280px; height: 90px;";
      case "medium":
        return "width: 340px; height: 100px;";
      case "large":
        return "width: 420px; height: 110px;";
      case "banner":
        return "width: 520px; height: 110px;";
      case "featured":
        return "width: 460px; height: 120px;";
      default:
        return "width: 320px; height: 95px;";
    }
  }}

  @media (max-width: 600px) {
    width: 100%;
    height: auto;
    min-height: 80px;
  }
`;

const NewsCard = styled(CardBase)<{ $featured?: boolean }>`
  display: flex;
  flex-direction: row;
  height: 100%;
  border-radius: 10px;

  ${(p) =>
    p.$featured &&
    `
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(192, 57, 43, 0.08) 100%);
    border: 1px solid rgba(231, 76, 60, 0.4);
    box-shadow: 0 4px 20px rgba(231, 76, 60, 0.15);

    &:hover {
      border-color: rgba(231, 76, 60, 0.6);
      box-shadow: 0 8px 30px rgba(231, 76, 60, 0.25);
    }
  `}
`;

const NewsImage = styled.div<{ $size: BentoSize }>`
  position: relative;
  flex-shrink: 0;

  ${(p) => {
    switch (p.$size) {
      case "small":
        return "width: 60px;";
      case "medium":
        return "width: 70px;";
      case "large":
      case "banner":
      case "featured":
        return "width: 90px;";
      default:
        return "width: 70px;";
    }
  }}

  @media (max-width: 600px) {
    width: 60px;
  }
`;

const NewsContent = styled.div<{ $hasImage: boolean }>`
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const NewsTitle = styled.h3<{ $size: BentoSize }>`
  margin: 0;
  color: ${(props) => props.theme.contrast};
  line-height: 1.3;
  font-family: var(--font-sans);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  ${(p) => {
    switch (p.$size) {
      case "small":
        return "font-size: 14px; font-weight: 600;";
      case "medium":
        return "font-size: 15px; font-weight: 600;";
      case "large":
        return "font-size: 17px; font-weight: 600;";
      case "banner":
        return "font-size: 18px; font-weight: 700;";
      case "featured":
        return "font-size: 20px; font-weight: 700;";
      default:
        return "font-size: 14px; font-weight: 600;";
    }
  }}
`;

const NewsDesc = styled.p<{ $size: BentoSize }>`
  margin: 4px 0 0;
  color: ${(props) => props.theme.postDescriptionText};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  ${(p) => {
    switch (p.$size) {
      case "small":
        return "font-size: 12px;";
      case "medium":
        return "font-size: 13px;";
      case "large":
        return "font-size: 14px;";
      case "banner":
        return "font-size: 15px;";
      case "featured":
        return "font-size: 17px;";
      default:
        return "font-size: 12px;";
    }
  }}
`;

const NewsDate = styled.span`
  margin-top: auto;
  padding-top: 4px;
  font-size: 10px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

// ========== FEATURED ==========
const FeaturedCard = styled(CardBase)`
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    min-height: 400px;
  }
`;

const FeaturedImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const FeaturedGradient = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 70%);
`;

const FeaturedContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px;
  z-index: 1;
`;

const FeaturedLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #9074f2;
  margin-bottom: 8px;
  display: block;
`;

const FeaturedTitle = styled.h2`
  margin: 0 0 10px;
  font-size: 32px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  font-family: var(--font-sans);
`;

const FeaturedDesc = styled.p`
  margin: 0 0 14px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// ========== LARGE ==========
const LargeCard = styled(CardBase)`
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    min-height: 350px;
  }
`;

const LargeImage = styled.div`
  position: relative;
  width: 100%;
  height: 60%;
  flex-shrink: 0;

  @media (max-width: 600px) {
    height: 180px;
  }
`;

const LargeContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
`;

// ========== BANNER ==========
const BannerCard = styled(CardBase)`
  display: flex;
  flex-direction: row;

  @media (max-width: 600px) {
    flex-direction: column;
    min-height: 320px;
  }
`;

const BannerImage = styled.div`
  position: relative;
  width: 35%;
  flex-shrink: 0;

  @media (max-width: 600px) {
    width: 100%;
    height: 160px;
  }
`;

const BannerContent = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  flex: 1;
`;

// ========== MEDIUM ==========
const MediumCard = styled(CardBase)`
  display: flex;
  flex-direction: row;

  @media (max-width: 600px) {
    flex-direction: column;
    min-height: 320px;
  }
`;

const MediumImage = styled.div`
  position: relative;
  width: 35%;
  flex-shrink: 0;

  @media (max-width: 600px) {
    width: 100%;
    height: 160px;
  }
`;

const MediumContent = styled.div`
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  overflow: hidden;
`;

const MediumMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
  padding-top: 8px;
`;

const MediumMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

// ========== SMALL ==========
const SmallCard = styled(CardBase)<{ $isPlaying?: boolean }>`
  position: relative;

  @media (max-width: 600px) {
    min-height: 200px;
  }
`;

const SmallImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const SmallOverlay = styled.div`
  position: absolute;
  inset: 0;
  padding: 12px;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0) 60%);
  z-index: 1;
`;

const SmallTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: white;
  line-height: 1.25;
  font-family: var(--font-sans);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// ========== SHARED COMPONENTS ==========
const CardTitle = styled.h3<{ $small?: boolean }>`
  margin: 0 0 8px;
  font-size: ${(props) => (props.$small ? "20px" : "24px")};
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  line-height: 1.25;
  font-family: var(--font-sans);
`;

const CardDesc = styled.p<{ $clamp?: number; $small?: boolean }>`
  margin: 0;
  font-size: ${(props) => (props.$small ? "13px" : "15px")};
  color: ${(props) => props.theme.postDescriptionText};
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: ${(props) => props.$clamp || 2};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: 10px;
`;

const ReadTime = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

const PlayButton = styled.div<{ $large?: boolean; $small?: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${(props) => (props.$large ? "70px" : props.$small ? "40px" : "50px")};
  height: ${(props) => (props.$large ? "70px" : props.$small ? "40px" : "50px")};
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;
  transition: all 0.2s ease;

  ${CardBase}:hover & {
    background: rgba(144, 116, 242, 0.9);
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

// ========== DIFFICULTY BADGE ==========
const DIFFICULTY_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  beginner: { bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.3)", color: "#4ade80" },
  intermediate: { bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.3)", color: "#fbbf24" },
  advanced: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", color: "#f87171" },
};

const DifficultyBadge = styled.span<{ $difficulty: string }>`
  font-size: 11px;
  font-weight: 500;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  padding: 0.1em 0.6em;
  border-radius: 4px;
  font-family: var(--font-mono);
  white-space: nowrap;
  background: ${(p) => DIFFICULTY_STYLES[p.$difficulty]?.bg ?? "rgba(255,255,255,0.08)"};
  border: 1px solid ${(p) => DIFFICULTY_STYLES[p.$difficulty]?.border ?? "rgba(255,255,255,0.15)"};
  color: ${(p) => DIFFICULTY_STYLES[p.$difficulty]?.color ?? "rgba(255,255,255,0.7)"};
`;

// Solid variants for small cards (over images)
const SOLID_DIFFICULTY_STYLES: Record<string, { bg: string; color: string }> = {
  beginner: { bg: "#166534", color: "#fff" },
  intermediate: { bg: "#854d0e", color: "#fef3c7" },
  advanced: { bg: "#991b1b", color: "#fff" },
};

const SmallDifficultyBadge = styled.span<{ $difficulty: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  padding: 0.15em 0.6em;
  border-radius: 4px;
  font-family: var(--font-mono);
  white-space: nowrap;
  background: ${(p) => SOLID_DIFFICULTY_STYLES[p.$difficulty]?.bg ?? "#333"};
  color: ${(p) => SOLID_DIFFICULTY_STYLES[p.$difficulty]?.color ?? "#fff"};
`;

const SmallLabel = styled.div`
  background: #3730a3;
  padding: 0.15em 0.6em;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  color: #e0e7ff;
  text-transform: lowercase;
`;

const SmallOverlayContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
`;

const SmallMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

// ========== LEGEND BADGE ==========
const TierBadgeWrapper = styled.div<{ $small?: boolean }>`
  position: absolute;
  top: ${(props) => (props.$small ? "8px" : "12px")};
  right: ${(props) => (props.$small ? "8px" : "12px")};
  z-index: 10;
`;

function TierBadge({ tier, small }: { tier: "tier1" | "tier2"; small?: boolean }) {
  return (
    <TierBadgeWrapper $small={small}>
      <SupporterBadge
        type={tier === "tier2" ? BadgeType.SUPER_LEGEND_2 : BadgeType.SUPER_LEGEND}
        size={small ? "small" : "medium"}
        showLabel
      />
    </TierBadgeWrapper>
  );
}

export default BentoCard;
