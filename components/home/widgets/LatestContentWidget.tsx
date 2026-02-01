import { useQuery } from "convex/react";
import { FileText, Film, Newspaper, Sparkles } from "lucide-react";
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

/** Latest content across all types */
export function LatestContentWidget({ compact }: { compact?: boolean }) {
  const [filter, setFilter] = useState<ContentFilter>("all");
  const posts = useQuery(api.blogPosts.getForBento, { excludeNews: false });

  const maxItems = compact ? 3 : 6;
  const filtered = posts
    ?.filter((p) => filter === "all" || p.contentType === filter)
    .slice(0, maxItems);

  return (
    <WidgetContainer title="Latest" icon={<Sparkles size={16} />} headerAction={<Link href="/learn">View all</Link>}>
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
        {filtered?.map((post) => {
          const thumb = getThumbnail(post);
          return (
            <ContentItem key={post._id} href={`/learn/${post.slug}`}>
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

const ContentItem = styled(Link)`
  position: relative;
  display: block;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  text-decoration: none;
  overflow: hidden;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(144,116,242,0.2);
  }
`;

const ContentBg = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 70%;
  overflow: hidden;
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(30, 30, 40, 1) 0%, rgba(30, 30, 40, 0.4) 100%);
  }
`;

const ContentBgImage = styled.div`
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0.5;
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

