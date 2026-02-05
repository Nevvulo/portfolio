import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Play, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import { api } from "../../../convex/_generated/api";
import { WidgetContainer } from "./WidgetContainer";

interface VideosWidgetProps {
  /** Pre-fetched posts to avoid duplicate subscriptions. Falls back to own query if not provided. */
  posts?: Array<{ _id: string; slug: string; title: string; contentType: string; coverImage?: string | null; youtubeId?: string | null; labels: string[]; publishedAt?: number | null }>;
}

export function VideosWidget({ posts: externalPosts }: VideosWidgetProps = {}) {
  const ownPosts = useQuery(api.blogPosts.getForBento, externalPosts ? "skip" : {});
  const allPosts = externalPosts ?? ownPosts;
  const videoPosts = allPosts
    ?.filter((p) => p.contentType === "video")
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
    .slice(0, 10) ?? [];

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = 280;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handlePreview = useCallback((e: React.MouseEvent, youtubeId: string | undefined) => {
    if (!youtubeId) return;
    e.preventDefault();
    e.stopPropagation();
    setPreviewId((prev) => (prev === youtubeId ? null : youtubeId));
  }, []);

  if (videoPosts.length === 0) {
    return null;
  }

  return (
    <WidgetContainer title="Videos" icon={<Video size={16} />} fullWidth noPadding headerAction={<Link href="/learn?type=video">View all</Link>}>
      <CarouselContainer>
        {canScrollLeft && (
          <ScrollButton $direction="left" onClick={() => scroll("left")}>
            <ChevronLeft size={20} />
          </ScrollButton>
        )}
        <Carousel ref={carouselRef} onScroll={handleScroll}>
          {videoPosts.map((video) => {
            const isShort = video.labels?.includes("short");
            const isPreviewing = previewId === video.youtubeId;
            return (
              <VideoCardWrapper key={video._id} $isShort={isShort}>
                {isPreviewing && video.youtubeId ? (
                  <EmbedContainer $isShort={isShort}>
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&mute=1`}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", borderRadius: "10px" }}
                    />
                  </EmbedContainer>
                ) : (
                  <ThumbnailContainer $isShort={isShort}>
                    <Image
                      src={
                        video.youtubeId
                          ? `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`
                          : video.coverImage || ""
                      }
                      alt={video.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                    {video.youtubeId && (
                      <PlayOverlay onClick={(e) => handlePreview(e, video.youtubeId)}>
                        <PlayButton>
                          <Play size={20} fill="white" />
                        </PlayButton>
                      </PlayOverlay>
                    )}
                  </ThumbnailContainer>
                )}
                <VideoTitleLink href={`/learn/${video.slug}`} prefetch={false}>
                  {video.title}
                </VideoTitleLink>
              </VideoCardWrapper>
            );
          })}
        </Carousel>
        {canScrollRight && (
          <ScrollButton $direction="right" onClick={() => scroll("right")}>
            <ChevronRight size={20} />
          </ScrollButton>
        )}
      </CarouselContainer>
    </WidgetContainer>
  );
}

const CarouselContainer = styled.div`
  position: relative;
  padding: 14px 0;
`;

const Carousel = styled.div`
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-left: 16px;
  scrollbar-width: none;
  padding: 0 16px;
  align-items: flex-start;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ScrollButton = styled.button<{ $direction: "left" | "right" }>`
  position: absolute;
  top: 50%;
  ${(props) => (props.$direction === "left" ? "left: 4px;" : "right: 4px;")}
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: ${(props) => props.theme.contrast};
  cursor: pointer;
  z-index: 2;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const VideoCardWrapper = styled.div<{ $isShort?: boolean }>`
  flex-shrink: 0;
  width: ${(props) => (props.$isShort ? "130px" : "280px")};
  scroll-snap-align: start;
`;

const ThumbnailContainer = styled.div<{ $isShort?: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${(props) => (props.$isShort ? "9 / 16" : "16 / 14")};
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
`;

const EmbedContainer = styled.div<{ $isShort?: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${(props) => (props.$isShort ? "9 / 16" : "16 / 14")};
  border-radius: 10px;
  overflow: hidden;
  background: #000;
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

  ${ThumbnailContainer}:hover & {
    opacity: 1;
  }
`;

const PlayButton = styled.div`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  color: white;
  backdrop-filter: blur(4px);
`;

const VideoTitleLink = styled(Link)`
  display: block;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
  line-height: 1.3;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  &:hover {
    text-decoration: underline;
  }
`;

