import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../components/layout/blog";
import { SimpleNavbar } from "../../components/navbar/simple";
import { api } from "../../convex/_generated/api";

interface RecommendationScore {
  slug: string;
  score: number;
}

interface DebugPost {
  _id: string;
  slug: string;
  title: string;
  contentType: "article" | "video" | "news";
  bentoSize: string;
  bentoOrder: number;
  bentoIndex: number;
  viewCount: number;
  publishedAt?: number;
  debug: {
    recScore: number;
    normalizedRecScore: number;
    maxRecScore: number;
    positionShift: number;
    sortKey: number;
    isFeatured: boolean;
    reason: string;
    hasPersonalization: boolean;
    finalRank: number;
    rankChange: number;
  };
}

interface DebugResponse {
  posts: DebugPost[];
  meta: {
    totalPosts: number;
    featuredCount: number;
    hasPersonalization: boolean;
    maxRecScore: number;
    maxPositionShift: number;
  };
}

export default function LearnDebug() {
  const { user, isSignedIn } = useUser();
  const [recScores, setRecScores] = useState<RecommendationScore[]>([]);
  const [simulateNoHistory, setSimulateNoHistory] = useState(false);

  const basePosts = useQuery(api.blogPosts.getForBento, { excludeNews: true });
  const watchHistory = useQuery(
    api.articleWatchTime.getUserWatchHistory,
    isSignedIn ? { limit: 50 } : "skip",
  );

  useEffect(() => {
    if (!isSignedIn || !user?.id || !basePosts || !watchHistory || simulateNoHistory) {
      setRecScores([]);
      return;
    }

    const fetchRecs = async () => {
      try {
        const response = await fetch("/api/recommendations/compute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            watchHistory: watchHistory.map((w) => ({
              slug: w.slug,
              totalSeconds: w.totalSeconds,
            })),
            posts: basePosts.map((p) => ({
              slug: p.slug,
              publishedAt: p.publishedAt,
              viewCount: p.viewCount,
              contentType: p.contentType,
            })),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setRecScores(data.recommendations || []);
        }
      } catch {
        // Silently fail
      }
    };

    fetchRecs();
  }, [isSignedIn, user?.id, basePosts, watchHistory, simulateNoHistory]);

  const debugData = useQuery(
    api.blogPosts.getForBentoDebug,
    basePosts
      ? {
          excludeNews: true,
          recommendationScores: recScores.length > 0 && !simulateNoHistory ? recScores : undefined,
        }
      : "skip",
  ) as DebugResponse | undefined;

  if (!isSignedIn) {
    return (
      <BlogView>
        <SimpleNavbar />
        <Container>
          <Message>Please sign in as a creator to access debug view.</Message>
        </Container>
      </BlogView>
    );
  }

  return (
    <BlogView>
      <SimpleNavbar />
      <Container>
        <Head>
          <title>Learn Debug - Ranking Visibility</title>
        </Head>

        <Header>
          <Title>Ranking Debug View</Title>
          <Subtitle>See why posts are ranked the way they are</Subtitle>
        </Header>

        <Controls>
          <ToggleButton
            $active={simulateNoHistory}
            onClick={() => setSimulateNoHistory(!simulateNoHistory)}
          >
            {simulateNoHistory ? "Simulating New User (No History)" : "Using Your Watch History"}
          </ToggleButton>
        </Controls>

        {debugData && (
          <>
            <MetaSection>
              <MetaCard>
                <MetaLabel>Total Posts</MetaLabel>
                <MetaValue>{debugData.meta.totalPosts}</MetaValue>
              </MetaCard>
              <MetaCard>
                <MetaLabel>Featured</MetaLabel>
                <MetaValue>{debugData.meta.featuredCount}</MetaValue>
              </MetaCard>
              <MetaCard>
                <MetaLabel>Personalization</MetaLabel>
                <MetaValue $highlight={debugData.meta.hasPersonalization}>
                  {debugData.meta.hasPersonalization ? "Active" : "Off"}
                </MetaValue>
              </MetaCard>
              <MetaCard>
                <MetaLabel>Max Rec Score</MetaLabel>
                <MetaValue>{debugData.meta.maxRecScore.toFixed(3)}</MetaValue>
              </MetaCard>
              <MetaCard>
                <MetaLabel>Max Position Shift</MetaLabel>
                <MetaValue>{debugData.meta.maxPositionShift}</MetaValue>
              </MetaCard>
            </MetaSection>

            <PostList>
              {debugData.posts.map((post, index) => (
                <PostCard key={post._id} $isFeatured={post.debug.isFeatured}>
                  <RankBadge $rank={index}>{index + 1}</RankBadge>

                  <PostInfo>
                    <PostTitle>{post.title}</PostTitle>
                    <PostMeta>
                      <Tag $type={post.contentType}>{post.contentType}</Tag>
                      <Tag $type={post.bentoSize}>{post.bentoSize}</Tag>
                      <span>{post.viewCount} views</span>
                      {post.publishedAt && (
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      )}
                    </PostMeta>
                  </PostInfo>

                  <DebugInfo>
                    <DebugRow>
                      <DebugLabel>Bento Order:</DebugLabel>
                      <DebugValue>
                        {post.bentoOrder} (index: {post.bentoIndex})
                      </DebugValue>
                    </DebugRow>
                    <DebugRow>
                      <DebugLabel>Rec Score:</DebugLabel>
                      <DebugValue>
                        {post.debug.recScore.toFixed(4)}
                        {post.debug.recScore > 0 && (
                          <ScoreBar $percent={post.debug.normalizedRecScore * 100} />
                        )}
                      </DebugValue>
                    </DebugRow>
                    <DebugRow>
                      <DebugLabel>Position Shift:</DebugLabel>
                      <DebugValue $shift={post.debug.positionShift}>
                        {post.debug.positionShift.toFixed(2)}
                      </DebugValue>
                    </DebugRow>
                    <DebugRow>
                      <DebugLabel>Sort Key:</DebugLabel>
                      <DebugValue>{post.debug.sortKey.toFixed(2)}</DebugValue>
                    </DebugRow>
                    <DebugRow>
                      <DebugLabel>Rank Change:</DebugLabel>
                      <RankChange $change={post.debug.rankChange}>
                        {post.debug.rankChange > 0 && "+"}
                        {post.debug.rankChange}
                        {post.debug.rankChange > 0 ? " ↑" : post.debug.rankChange < 0 ? " ↓" : ""}
                      </RankChange>
                    </DebugRow>
                    <ReasonBox $isFeatured={post.debug.isFeatured}>{post.debug.reason}</ReasonBox>
                  </DebugInfo>
                </PostCard>
              ))}
            </PostList>
          </>
        )}

        {!debugData && <Message>Loading debug data...</Message>}
      </Container>
    </BlogView>
  );
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
  margin: 0 0 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${(p) => p.theme.textColor};
  margin: 0;
`;

const Controls = styled.div`
  margin-bottom: 24px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$active ? "#f59e0b" : "rgba(144, 116, 242, 0.4)")};
  background: ${(p) => (p.$active ? "rgba(245, 158, 11, 0.2)" : "rgba(144, 116, 242, 0.1)")};
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? "rgba(245, 158, 11, 0.3)" : "rgba(144, 116, 242, 0.2)")};
  }
`;

const MetaSection = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 32px;
`;

const MetaCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px 24px;
  min-width: 120px;
`;

const MetaLabel = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetaValue = styled.div<{ $highlight?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  color: ${(p) => (p.$highlight ? "#22c55e" : p.theme.contrast)};
`;

const PostList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PostCard = styled.div<{ $isFeatured: boolean }>`
  display: grid;
  grid-template-columns: 60px 1fr 300px;
  gap: 16px;
  align-items: start;
  background: ${(p) =>
    p.$isFeatured
      ? "linear-gradient(135deg, rgba(144, 116, 242, 0.15) 0%, rgba(144, 116, 242, 0.05) 100%)"
      : "rgba(255, 255, 255, 0.03)"};
  border: 1px solid ${(p) => (p.$isFeatured ? "rgba(144, 116, 242, 0.4)" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 12px;
  padding: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 50px 1fr;
    gap: 12px;
  }
`;

const RankBadge = styled.div<{ $rank: number }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  background: ${(p) => {
    if (p.$rank === 0) return "linear-gradient(135deg, #ffd700, #ffaa00)";
    if (p.$rank === 1) return "linear-gradient(135deg, #c0c0c0, #a0a0a0)";
    if (p.$rank === 2) return "linear-gradient(135deg, #cd7f32, #a0522d)";
    return "rgba(255, 255, 255, 0.1)";
  }};
  color: ${(p) => (p.$rank < 3 ? "#000" : p.theme.contrast)};
`;

const PostInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PostTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0;
  line-height: 1.3;
`;

const PostMeta = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
`;

const Tag = styled.span<{ $type: string }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${(p) => {
    if (p.$type === "article") return "rgba(59, 130, 246, 0.2)";
    if (p.$type === "video") return "rgba(239, 68, 68, 0.2)";
    if (p.$type === "featured") return "rgba(144, 116, 242, 0.3)";
    if (p.$type === "large") return "rgba(34, 197, 94, 0.2)";
    if (p.$type === "medium") return "rgba(249, 115, 22, 0.2)";
    return "rgba(255, 255, 255, 0.1)";
  }};
  color: ${(p) => {
    if (p.$type === "article") return "#60a5fa";
    if (p.$type === "video") return "#f87171";
    if (p.$type === "featured") return "#a78bfa";
    if (p.$type === "large") return "#4ade80";
    if (p.$type === "medium") return "#fb923c";
    return p.theme.textColor;
  }};
`;

const DebugInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: "SF Mono", Monaco, monospace;
  font-size: 12px;

  @media (max-width: 900px) {
    grid-column: 1 / -1;
  }
`;

const DebugRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DebugLabel = styled.span`
  color: ${(p) => p.theme.textColor};
`;

const DebugValue = styled.span<{ $shift?: number }>`
  color: ${(p) => {
    if (p.$shift !== undefined) {
      if (p.$shift < 0) return "#22c55e";
      if (p.$shift > 0) return "#ef4444";
    }
    return p.theme.contrast;
  }};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ScoreBar = styled.div<{ $percent: number }>`
  width: 60px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${(p) => p.$percent}%;
    background: linear-gradient(90deg, #22c55e, #4ade80);
    border-radius: 3px;
  }
`;

const RankChange = styled.span<{ $change: number }>`
  font-weight: 600;
  color: ${(p) => {
    if (p.$change > 0) return "#22c55e";
    if (p.$change < 0) return "#ef4444";
    return p.theme.textColor;
  }};
`;

const ReasonBox = styled.div<{ $isFeatured: boolean }>`
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  background: ${(p) => (p.$isFeatured ? "rgba(144, 116, 242, 0.2)" : "rgba(255, 255, 255, 0.05)")};
  color: ${(p) => (p.$isFeatured ? "#a78bfa" : p.theme.textColor)};
  font-family: var(--font-sans);
`;

const Message = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: ${(p) => p.theme.textColor};
  font-size: 16px;
`;
