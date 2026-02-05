import { useQuery } from "convex/react";
import { Clock, FileText, Film, Newspaper, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";
import { api } from "../../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../../constants/theme";
import { WidgetContainer } from "./WidgetContainer";

type ContentFilter = "all" | "article" | "video" | "news";

const FILTERS: { key: ContentFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Sparkles size={12} /> },
  { key: "article", label: "Articles", icon: <FileText size={12} /> },
  { key: "video", label: "Videos", icon: <Film size={12} /> },
  { key: "news", label: "News", icon: <Newspaper size={12} /> },
];

function getThumbnail(post: { coverImage?: string | null; youtubeId?: string | null }): string | null {
  if (post.coverImage) return post.coverImage;
  if (post.youtubeId) return `https://img.youtube.com/vi/${post.youtubeId}/mqdefault.jpg`;
  return null;
}

interface LatestContentWidgetProps {
  compact?: boolean;
  /** Pre-fetched posts to avoid duplicate subscriptions. Falls back to own query if not provided. */
  posts?: Array<{ _id: string; slug: string; title: string; description: string; contentType: string; coverImage?: string | null; youtubeId?: string | null; publishedAt?: number | null }>;
}

/** Latest content across all types */
export function LatestContentWidget({ compact, posts: externalPosts }: LatestContentWidgetProps) {
  const [filter, setFilter] = useState<ContentFilter>("all");
  const ownPosts = useQuery(api.blogPosts.getForBento, externalPosts ? "skip" : { excludeNews: false });
  const posts = externalPosts ?? ownPosts;

  const maxItems = compact ? 3 : 6;
  const filtered = posts
    ?.filter((p) => filter === "all" || p.contentType === filter)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
    .slice(0, maxItems);

  return (
    <WidgetContainer title="Latest" icon={<Clock size={16} />} headerAction={<Link href="/learn">View all</Link>}>
      <FilterRow>
        {FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            $active={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.icon}
            {f.label}
          </FilterChip>
        ))}
      </FilterRow>

      <ContentList>
        {!posts && Array.from({ length: 6 }).map((_, i) => (
          <SkeletonItem key={i}>
            <SkeletonBadge />
            <SkeletonTitle />
            <SkeletonDesc />
          </SkeletonItem>
        ))}
        {filtered?.map((post) => {
          const thumb = getThumbnail(post);
          const isYouTube = post.contentType === "video" && post.youtubeId;
          const href = isYouTube ? `https://www.youtube.com/watch?v=${post.youtubeId}` : `/learn/${post.slug}`;
          return (
            <ContentItem key={post._id} href={href} {...(isYouTube ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {thumb && (
                <ContentBg>
                  <ContentBgImage style={{ backgroundImage: `url(${thumb})` }} />
                </ContentBg>
              )}
              <ContentInner>
                <ContentMeta>
                  <TypeBadge $type={post.contentType}>
                    {post.contentType === "article" ? "Article" : post.contentType === "video" ? "Video" : "News"}
                  </TypeBadge>
                  {post.publishedAt && (
                    <ContentDate>
                      {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </ContentDate>
                  )}
                </ContentMeta>
                <ContentTitle>{post.title}</ContentTitle>
                {!compact && <ContentDesc>{post.description}</ContentDesc>}
              </ContentInner>
            </ContentItem>
          );
        })}
      </ContentList>

    </WidgetContainer>
  );
}

const FilterRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
`;

const FilterChip = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid ${(p) => (p.$active ? "rgba(144,116,242,0.4)" : "rgba(255,255,255,0.08)")};
  background: ${(p) => (p.$active ? "rgba(144,116,242,0.15)" : "rgba(255,255,255,0.03)")};
  color: ${(p) => (p.$active ? LOUNGE_COLORS.tier1 : "rgba(255,255,255,0.6)")};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { border-color: rgba(144,116,242,0.3); }
`;

const ContentList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ContentItemBase = styled.a`
  position: relative;
  display: block;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(144,116,242,0.2);
  }
`;

function ContentItem({ href, children, ...props }: React.ComponentProps<typeof ContentItemBase> & { href: string }) {
  const isExternal = href.startsWith("http");
  if (isExternal) {
    return <ContentItemBase href={href} {...props}>{children}</ContentItemBase>;
  }
  return (
    <Link href={href} prefetch={false} passHref legacyBehavior>
      <ContentItemBase {...props}>{children}</ContentItemBase>
    </Link>
  );
}

const ContentBg = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(30, 30, 40, 1) 0%, rgba(30, 30, 40, 1) 30%, rgba(30, 30, 40, 0.6) 60%, rgba(30, 30, 40, 0.3) 100%);
  }
`;

const ContentBgImage = styled.div`
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: right center;
  opacity: 0.35;
`;

const ContentInner = styled.div`
  position: relative;
  z-index: 1;
  padding: 10px 12px;
`;

const ContentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const TypeBadge = styled.span<{ $type?: string }>`
  font-size: 11px;
  font-weight: 500;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  padding: 0.1em 0.6em;
  border-radius: 4px;
  font-family: var(--font-mono);
  background: ${(p) =>
    p.$type === "article" ? "rgba(79,77,193,0.15)" :
    p.$type === "video" ? "rgba(193,77,120,0.15)" :
    "rgba(193,160,77,0.15)"};
  border: 1px solid ${(p) =>
    p.$type === "article" ? "rgba(79,77,193,0.3)" :
    p.$type === "video" ? "rgba(193,77,120,0.3)" :
    "rgba(193,160,77,0.3)"};
  color: ${(p) =>
    p.$type === "article" ? "#a5a3f5" :
    p.$type === "video" ? "#f5a3bf" :
    "#f5dba3"};
`;

const ContentDate = styled.span`
  font-size: 12px;
  color: rgba(255,255,255,0.4);
`;

const ContentTitle = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: white;
  line-height: 1.3;
`;

const ContentDesc = styled.p`
  margin: 3px 0 0;
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const shimmer = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const SkeletonItem = styled.div`
  background: ${(p) => p.theme.postBackground};
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SkeletonBadge = styled.div`
  width: 52px;
  height: 18px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  ${shimmer}
`;

const SkeletonTitle = styled.div`
  width: 75%;
  height: 15px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  ${shimmer}
`;

const SkeletonDesc = styled.div`
  width: 90%;
  height: 13px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  ${shimmer}
`;

