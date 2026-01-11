import { useAction, useMutation, useQuery } from "convex/react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { api } from "../../../convex/_generated/api";

// Dynamically import MDXEditor to avoid SSR issues with TipTap
const MDXEditor = dynamic(
  () => import("../../../components/editor/MDXEditor").then((mod) => mod.MDXEditor),
  {
    ssr: false,
    loading: () => <div style={{ padding: "20px", color: "#888" }}>Loading editor...</div>,
  },
);

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  Eye,
  FileText,
  Heart,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Play,
  Plus,
  RefreshCw,
  Search,
  ThumbsUp,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BlogView } from "../../../components/layout/blog";
import {
  type AdminBentoCardProps,
  DraggableBentoGrid,
} from "../../../components/learn/DraggableBentoGrid";
import { SimpleNavbar } from "../../../components/navbar/simple";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { useTierAccess } from "../../../hooks/lounge/useTierAccess";

export const getServerSideProps = () => ({ props: {} });

type TabType = "analytics" | "posts" | "migration" | "discord";

type BlogPost = Doc<"blogPosts">;

export default function BlogAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const { isLoading, isCreator } = useTierAccess();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Blog Admin" />
        <Container>
          <p>Loading...</p>
        </Container>
      </BlogView>
    );
  }

  if (!isCreator) {
    return (
      <>
        <Head>
          <title>Access Denied | Blog Admin</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Blog Admin" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access the blog admin panel.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Blog Admin | Nevulo</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Blog Admin" />
        <AdminContainer>
          <Header>
            <Title>Blog Admin</Title>
            <Text>Manage your blog posts and layout</Text>
          </Header>

          <TabBar>
            <Tab $active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>
              <TrendingUp size={16} /> Analytics
            </Tab>
            <Tab $active={activeTab === "posts"} onClick={() => setActiveTab("posts")}>
              <FileText size={16} /> Posts
            </Tab>
            <Tab $active={activeTab === "migration"} onClick={() => setActiveTab("migration")}>
              <RefreshCw size={16} /> Migration
            </Tab>
            <Tab $active={activeTab === "discord"} onClick={() => setActiveTab("discord")}>
              <MessageSquare size={16} /> Discord
            </Tab>
          </TabBar>

          <TabContent>
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "posts" && <PostsTab />}
            {activeTab === "migration" && <MigrationTab />}
            {activeTab === "discord" && <DiscordTab />}
          </TabContent>
        </AdminContainer>
      </BlogView>
    </>
  );
}

// Color palette for charts
const CHART_COLORS = {
  primary: "#6366f1", // Indigo
  secondary: "#8b5cf6", // Violet
  accent: "#ec4899", // Pink
  success: "#10b981", // Emerald
  warning: "#f59e0b", // Amber
  like: "#ef4444", // Red for likes
  helpful: "#3b82f6", // Blue for helpful
  insightful: "#8b5cf6", // Violet for insightful
  comments: "#10b981", // Green for comments
  views: "#6366f1", // Indigo for views
};

type TimePeriod = 7 | 30 | 90 | 180 | 365;
type AnalyticsSubTab = "overview" | "views" | "reactions" | "comments" | "posts";

// Analytics Tab - Completely redesigned
function AnalyticsTab() {
  const [days, setDays] = useState<TimePeriod>(30);
  const [subTab, setSubTab] = useState<AnalyticsSubTab>("overview");

  const detailedAnalytics = useQuery(api.blogAnalytics.getDetailedAnalytics, { days });
  const viewsOverTime = useQuery(api.blogAnalytics.getViewsOverTime, { days });
  const reactionsOverTime = useQuery(api.blogAnalytics.getReactionsOverTime, { days });
  const commentsOverTime = useQuery(api.blogAnalytics.getCommentsOverTime, { days });
  const allPostsAnalytics = useQuery(api.blogAnalytics.getAllPostsAnalytics, { days });

  if (!detailedAnalytics) {
    return (
      <TabPanel>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading analytics...</LoadingText>
        </LoadingContainer>
      </TabPanel>
    );
  }

  return (
    <TabPanel>
      {/* Time Period Selector */}
      <AnalyticsHeader>
        <AnalyticsSubTabs>
          <SubTab $active={subTab === "overview"} onClick={() => setSubTab("overview")}>
            <BarChart3 size={14} /> Overview
          </SubTab>
          <SubTab $active={subTab === "views"} onClick={() => setSubTab("views")}>
            <Eye size={14} /> Views
          </SubTab>
          <SubTab $active={subTab === "reactions"} onClick={() => setSubTab("reactions")}>
            <Heart size={14} /> Reactions
          </SubTab>
          <SubTab $active={subTab === "comments"} onClick={() => setSubTab("comments")}>
            <MessageCircle size={14} /> Comments
          </SubTab>
          <SubTab $active={subTab === "posts"} onClick={() => setSubTab("posts")}>
            <FileText size={14} /> By Post
          </SubTab>
        </AnalyticsSubTabs>
        <TimePeriodSelector>
          <Calendar size={14} />
          {([7, 30, 90, 180, 365] as TimePeriod[]).map((period) => (
            <PeriodButton key={period} $active={days === period} onClick={() => setDays(period)}>
              {period === 365 ? "1Y" : `${period}D`}
            </PeriodButton>
          ))}
        </TimePeriodSelector>
      </AnalyticsHeader>

      {/* Sub-tab Content */}
      {subTab === "overview" && (
        <OverviewTab
          analytics={detailedAnalytics}
          viewsData={viewsOverTime}
          reactionsData={reactionsOverTime}
          commentsData={commentsOverTime}
          days={days}
        />
      )}
      {subTab === "views" && (
        <ViewsTab viewsData={viewsOverTime} analytics={detailedAnalytics} days={days} />
      )}
      {subTab === "reactions" && (
        <ReactionsTab reactionsData={reactionsOverTime} analytics={detailedAnalytics} days={days} />
      )}
      {subTab === "comments" && (
        <CommentsTab commentsData={commentsOverTime} analytics={detailedAnalytics} days={days} />
      )}
      {subTab === "posts" && <PostsAnalyticsTab postsData={allPostsAnalytics} days={days} />}
    </TabPanel>
  );
}

// Overview Sub-tab
function OverviewTab({
  analytics,
  viewsData,
  reactionsData,
  commentsData,
  days,
}: {
  analytics: any;
  viewsData: any;
  reactionsData: any;
  commentsData: any;
  days: number;
}) {
  return (
    <>
      {/* Summary Cards */}
      <MetricsGrid>
        <MetricCard $color={CHART_COLORS.views}>
          <MetricIcon>
            <Eye size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{analytics.summary.views.current.toLocaleString()}</MetricValue>
            <MetricLabel>Views ({days}d)</MetricLabel>
            <MetricChange $positive={analytics.summary.views.change >= 0}>
              {analytics.summary.views.change >= 0 ? (
                <ArrowUp size={12} />
              ) : (
                <ArrowDown size={12} />
              )}
              {Math.abs(analytics.summary.views.change)}%
            </MetricChange>
          </MetricContent>
        </MetricCard>

        <MetricCard $color={CHART_COLORS.like}>
          <MetricIcon>
            <Heart size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{analytics.summary.reactions.current.toLocaleString()}</MetricValue>
            <MetricLabel>Reactions ({days}d)</MetricLabel>
            <MetricChange $positive={analytics.summary.reactions.change >= 0}>
              {analytics.summary.reactions.change >= 0 ? (
                <ArrowUp size={12} />
              ) : (
                <ArrowDown size={12} />
              )}
              {Math.abs(analytics.summary.reactions.change)}%
            </MetricChange>
          </MetricContent>
        </MetricCard>

        <MetricCard $color={CHART_COLORS.comments}>
          <MetricIcon>
            <MessageCircle size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{analytics.summary.comments.current.toLocaleString()}</MetricValue>
            <MetricLabel>Comments ({days}d)</MetricLabel>
            <MetricChange $positive={analytics.summary.comments.change >= 0}>
              {analytics.summary.comments.change >= 0 ? (
                <ArrowUp size={12} />
              ) : (
                <ArrowDown size={12} />
              )}
              {Math.abs(analytics.summary.comments.change)}%
            </MetricChange>
          </MetricContent>
        </MetricCard>

        <MetricCard $color={CHART_COLORS.secondary}>
          <MetricIcon>
            <FileText size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{analytics.summary.publishedPosts}</MetricValue>
            <MetricLabel>Published Posts</MetricLabel>
            <MetricSubtext>{analytics.summary.draftPosts} drafts</MetricSubtext>
          </MetricContent>
        </MetricCard>
      </MetricsGrid>

      {/* Combined Activity Chart */}
      <ChartSection>
        <ChartHeader>
          <ChartTitle>Activity Overview</ChartTitle>
        </ChartHeader>
        <ChartContainer>
          {viewsData && viewsData.length > 0 ? (
            <CombinedChart
              viewsData={viewsData}
              reactionsData={reactionsData}
              commentsData={commentsData}
            />
          ) : (
            <NoDataMessage>No activity data for this period</NoDataMessage>
          )}
        </ChartContainer>
      </ChartSection>

      {/* Reaction Breakdown */}
      <BreakdownSection>
        <SectionTitle>Reaction Breakdown</SectionTitle>
        <ReactionBreakdownGrid>
          <ReactionBreakdownCard $color={CHART_COLORS.like}>
            <ReactionIcon>
              <ThumbsUp size={20} />
            </ReactionIcon>
            <ReactionCount>{analytics.reactionBreakdown.like}</ReactionCount>
            <ReactionType>Likes</ReactionType>
          </ReactionBreakdownCard>
          <ReactionBreakdownCard $color={CHART_COLORS.helpful}>
            <ReactionIcon>
              <Heart size={20} />
            </ReactionIcon>
            <ReactionCount>{analytics.reactionBreakdown.helpful}</ReactionCount>
            <ReactionType>Helpful</ReactionType>
          </ReactionBreakdownCard>
          <ReactionBreakdownCard $color={CHART_COLORS.insightful}>
            <ReactionIcon>
              <Lightbulb size={20} />
            </ReactionIcon>
            <ReactionCount>{analytics.reactionBreakdown.insightful}</ReactionCount>
            <ReactionType>Insightful</ReactionType>
          </ReactionBreakdownCard>
        </ReactionBreakdownGrid>
      </BreakdownSection>

      {/* Top Posts */}
      <TopPostsSection>
        <TopPostsGrid>
          <TopPostsColumn>
            <SectionTitle>Top Posts by Views</SectionTitle>
            <TopPostsList>
              {analytics.topPostsByViews.slice(0, 5).map((post: any, i: number) => (
                <TopPostItem key={post._id}>
                  <TopPostRank $top={i < 3}>#{i + 1}</TopPostRank>
                  <TopPostInfo>
                    <TopPostTitle>{post.title}</TopPostTitle>
                    <TopPostValue>{post.views.toLocaleString()} views</TopPostValue>
                  </TopPostInfo>
                </TopPostItem>
              ))}
              {analytics.topPostsByViews.length === 0 && (
                <EmptyTopPosts>No views in this period</EmptyTopPosts>
              )}
            </TopPostsList>
          </TopPostsColumn>

          <TopPostsColumn>
            <SectionTitle>Top Posts by Reactions</SectionTitle>
            <TopPostsList>
              {analytics.topPostsByReactions.slice(0, 5).map((post: any, i: number) => (
                <TopPostItem key={post._id}>
                  <TopPostRank $top={i < 3}>#{i + 1}</TopPostRank>
                  <TopPostInfo>
                    <TopPostTitle>{post.title}</TopPostTitle>
                    <TopPostValue>{post.reactions.toLocaleString()} reactions</TopPostValue>
                  </TopPostInfo>
                </TopPostItem>
              ))}
              {analytics.topPostsByReactions.length === 0 && (
                <EmptyTopPosts>No reactions in this period</EmptyTopPosts>
              )}
            </TopPostsList>
          </TopPostsColumn>

          <TopPostsColumn>
            <SectionTitle>Top Posts by Comments</SectionTitle>
            <TopPostsList>
              {analytics.topPostsByComments.slice(0, 5).map((post: any, i: number) => (
                <TopPostItem key={post._id}>
                  <TopPostRank $top={i < 3}>#{i + 1}</TopPostRank>
                  <TopPostInfo>
                    <TopPostTitle>{post.title}</TopPostTitle>
                    <TopPostValue>{post.comments.toLocaleString()} comments</TopPostValue>
                  </TopPostInfo>
                </TopPostItem>
              ))}
              {analytics.topPostsByComments.length === 0 && (
                <EmptyTopPosts>No comments in this period</EmptyTopPosts>
              )}
            </TopPostsList>
          </TopPostsColumn>
        </TopPostsGrid>
      </TopPostsSection>
    </>
  );
}

// Combined Chart Component
function CombinedChart({
  viewsData,
  reactionsData,
  commentsData,
}: {
  viewsData: any[];
  reactionsData: any[];
  commentsData: any[];
}) {
  const data = useMemo(() => {
    return viewsData.map((d, i) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: d.views,
      reactions: reactionsData?.[i]?.total || 0,
      comments: commentsData?.[i]?.comments || 0,
    }));
  }, [viewsData, reactionsData, commentsData]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.views} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.views} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorReactions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.like} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.like} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.comments} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.comments} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
        <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="views"
          stroke={CHART_COLORS.views}
          fill="url(#colorViews)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="reactions"
          stroke={CHART_COLORS.like}
          fill="url(#colorReactions)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="comments"
          stroke={CHART_COLORS.comments}
          fill="url(#colorComments)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Views Tab
function ViewsTab({
  viewsData,
  analytics,
  days,
}: {
  viewsData: any;
  analytics: any;
  days: number;
}) {
  const chartData = useMemo(() => {
    if (!viewsData) return [];
    return viewsData.map((d: any) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: d.views,
    }));
  }, [viewsData]);

  const totalViews = viewsData?.reduce((sum: number, d: any) => sum + d.views, 0) || 0;
  const avgViews = viewsData?.length ? Math.round(totalViews / viewsData.length) : 0;
  const maxViews = viewsData?.reduce((max: number, d: any) => Math.max(max, d.views), 0) || 0;

  return (
    <>
      <MetricsGrid>
        <MetricCard $color={CHART_COLORS.views}>
          <MetricContent>
            <MetricValue>{totalViews.toLocaleString()}</MetricValue>
            <MetricLabel>Total Views</MetricLabel>
          </MetricContent>
        </MetricCard>
        <MetricCard $color={CHART_COLORS.secondary}>
          <MetricContent>
            <MetricValue>{avgViews.toLocaleString()}</MetricValue>
            <MetricLabel>Avg/Day</MetricLabel>
          </MetricContent>
        </MetricCard>
        <MetricCard $color={CHART_COLORS.accent}>
          <MetricContent>
            <MetricValue>{maxViews.toLocaleString()}</MetricValue>
            <MetricLabel>Peak Day</MetricLabel>
          </MetricContent>
        </MetricCard>
        <MetricCard $color={CHART_COLORS.success}>
          <MetricContent>
            <MetricValue>
              {analytics.summary.views.change >= 0 ? "+" : ""}
              {analytics.summary.views.change}%
            </MetricValue>
            <MetricLabel>vs Previous</MetricLabel>
          </MetricContent>
        </MetricCard>
      </MetricsGrid>

      <ChartSection>
        <ChartHeader>
          <ChartTitle>Views Over Time</ChartTitle>
        </ChartHeader>
        <LargeChartContainer>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViewsLarge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.views} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.views} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke={CHART_COLORS.views}
                  fill="url(#colorViewsLarge)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <NoDataMessage>No views data for this period</NoDataMessage>
          )}
        </LargeChartContainer>
      </ChartSection>

      <TopPostsSection>
        <SectionTitle>Top Viewed Posts ({days}d)</SectionTitle>
        <TopPostsList>
          {analytics.topPostsByViews.map((post: any, i: number) => (
            <TopPostItem key={post._id}>
              <TopPostRank $top={i < 3}>#{i + 1}</TopPostRank>
              <TopPostInfo>
                <TopPostTitle>{post.title}</TopPostTitle>
                <TopPostValue>{post.views.toLocaleString()} views</TopPostValue>
              </TopPostInfo>
              <TopPostBar>
                <TopPostBarFill
                  style={{
                    width: `${(post.views / (analytics.topPostsByViews[0]?.views || 1)) * 100}%`,
                    background: CHART_COLORS.views,
                  }}
                />
              </TopPostBar>
            </TopPostItem>
          ))}
        </TopPostsList>
      </TopPostsSection>
    </>
  );
}

// Reactions Tab
function ReactionsTab({
  reactionsData,
  analytics,
  days,
}: {
  reactionsData: any;
  analytics: any;
  days: number;
}) {
  const chartData = useMemo(() => {
    if (!reactionsData) return [];
    return reactionsData.map((d: any) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      like: d.like,
      helpful: d.helpful,
      insightful: d.insightful,
    }));
  }, [reactionsData]);

  const totalReactions = analytics.summary.reactions.current;
  const { like, helpful, insightful } = analytics.reactionBreakdown;

  return (
    <>
      <MetricsGrid>
        <MetricCard $color={CHART_COLORS.like}>
          <MetricIcon>
            <ThumbsUp size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{like}</MetricValue>
            <MetricLabel>Likes</MetricLabel>
            <MetricSubtext>
              {totalReactions > 0 ? Math.round((like / totalReactions) * 100) : 0}%
            </MetricSubtext>
          </MetricContent>
        </MetricCard>
        <MetricCard $color={CHART_COLORS.helpful}>
          <MetricIcon>
            <Heart size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{helpful}</MetricValue>
            <MetricLabel>Helpful</MetricLabel>
            <MetricSubtext>
              {totalReactions > 0 ? Math.round((helpful / totalReactions) * 100) : 0}%
            </MetricSubtext>
          </MetricContent>
        </MetricCard>
        <MetricCard $color={CHART_COLORS.insightful}>
          <MetricIcon>
            <Lightbulb size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{insightful}</MetricValue>
            <MetricLabel>Insightful</MetricLabel>
            <MetricSubtext>
              {totalReactions > 0 ? Math.round((insightful / totalReactions) * 100) : 0}%
            </MetricSubtext>
          </MetricContent>
        </MetricCard>
        <MetricCard $color={CHART_COLORS.success}>
          <MetricContent>
            <MetricValue>{totalReactions}</MetricValue>
            <MetricLabel>Total ({days}d)</MetricLabel>
            <MetricChange $positive={analytics.summary.reactions.change >= 0}>
              {analytics.summary.reactions.change >= 0 ? (
                <ArrowUp size={12} />
              ) : (
                <ArrowDown size={12} />
              )}
              {Math.abs(analytics.summary.reactions.change)}%
            </MetricChange>
          </MetricContent>
        </MetricCard>
      </MetricsGrid>

      <ChartSection>
        <ChartHeader>
          <ChartTitle>Reactions Over Time</ChartTitle>
          <ChartLegend>
            <LegendItem>
              <LegendDot style={{ background: CHART_COLORS.like }} /> Likes
            </LegendItem>
            <LegendItem>
              <LegendDot style={{ background: CHART_COLORS.helpful }} /> Helpful
            </LegendItem>
            <LegendItem>
              <LegendDot style={{ background: CHART_COLORS.insightful }} /> Insightful
            </LegendItem>
          </ChartLegend>
        </ChartHeader>
        <LargeChartContainer>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="like"
                  stackId="reactions"
                  fill={CHART_COLORS.like}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="helpful"
                  stackId="reactions"
                  fill={CHART_COLORS.helpful}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="insightful"
                  stackId="reactions"
                  fill={CHART_COLORS.insightful}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoDataMessage>No reactions data for this period</NoDataMessage>
          )}
        </LargeChartContainer>
      </ChartSection>

      <TopPostsSection>
        <SectionTitle>Most Reacted Posts ({days}d)</SectionTitle>
        <TopPostsList>
          {analytics.topPostsByReactions.map((post: any, i: number) => (
            <TopPostItem key={post._id}>
              <TopPostRank $top={i < 3}>#{i + 1}</TopPostRank>
              <TopPostInfo>
                <TopPostTitle>{post.title}</TopPostTitle>
                <TopPostValue>{post.reactions.toLocaleString()} reactions</TopPostValue>
              </TopPostInfo>
              <TopPostBar>
                <TopPostBarFill
                  style={{
                    width: `${(post.reactions / (analytics.topPostsByReactions[0]?.reactions || 1)) * 100}%`,
                    background: CHART_COLORS.like,
                  }}
                />
              </TopPostBar>
            </TopPostItem>
          ))}
        </TopPostsList>
      </TopPostsSection>
    </>
  );
}

// Comments Tab
function CommentsTab({
  commentsData,
  analytics,
  days,
}: {
  commentsData: any;
  analytics: any;
  days: number;
}) {
  const chartData = useMemo(() => {
    if (!commentsData) return [];
    return commentsData.map((d: any) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      comments: d.comments,
    }));
  }, [commentsData]);

  const totalComments = analytics.summary.comments.current;
  const avgComments = commentsData?.length ? Math.round(totalComments / commentsData.length) : 0;

  return (
    <>
      <MetricsGrid>
        <MetricCard $color={CHART_COLORS.comments}>
          <MetricIcon>
            <MessageCircle size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{totalComments}</MetricValue>
            <MetricLabel>Total Comments</MetricLabel>
          </MetricContent>
        </MetricCard>
        <MetricCard $color={CHART_COLORS.secondary}>
          <MetricContent>
            <MetricValue>{avgComments}</MetricValue>
            <MetricLabel>Avg/Day</MetricLabel>
          </MetricContent>
        </MetricCard>
        <MetricCard $color={CHART_COLORS.success}>
          <MetricContent>
            <MetricValue>
              {analytics.summary.comments.change >= 0 ? "+" : ""}
              {analytics.summary.comments.change}%
            </MetricValue>
            <MetricLabel>vs Previous</MetricLabel>
          </MetricContent>
        </MetricCard>
        <MetricCard $color={CHART_COLORS.accent}>
          <MetricContent>
            <MetricValue>{analytics.topPostsByComments.length}</MetricValue>
            <MetricLabel>Posts w/ Comments</MetricLabel>
          </MetricContent>
        </MetricCard>
      </MetricsGrid>

      <ChartSection>
        <ChartHeader>
          <ChartTitle>Comments Over Time</ChartTitle>
        </ChartHeader>
        <LargeChartContainer>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="comments" fill={CHART_COLORS.comments} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoDataMessage>No comments data for this period</NoDataMessage>
          )}
        </LargeChartContainer>
      </ChartSection>

      <TopPostsSection>
        <SectionTitle>Most Commented Posts ({days}d)</SectionTitle>
        <TopPostsList>
          {analytics.topPostsByComments.map((post: any, i: number) => (
            <TopPostItem key={post._id}>
              <TopPostRank $top={i < 3}>#{i + 1}</TopPostRank>
              <TopPostInfo>
                <TopPostTitle>{post.title}</TopPostTitle>
                <TopPostValue>{post.comments.toLocaleString()} comments</TopPostValue>
              </TopPostInfo>
              <TopPostBar>
                <TopPostBarFill
                  style={{
                    width: `${(post.comments / (analytics.topPostsByComments[0]?.comments || 1)) * 100}%`,
                    background: CHART_COLORS.comments,
                  }}
                />
              </TopPostBar>
            </TopPostItem>
          ))}
        </TopPostsList>
      </TopPostsSection>
    </>
  );
}

// Posts Analytics Tab
function PostsAnalyticsTab({ postsData, days }: { postsData: any; days: number }) {
  const [sortBy, setSortBy] = useState<"views" | "reactions" | "comments">("views");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  if (!postsData) {
    return (
      <LoadingContainer>
        <LoadingText>Loading posts...</LoadingText>
      </LoadingContainer>
    );
  }

  const sortedPosts = [...postsData].sort((a, b) => {
    const aVal =
      sortBy === "views"
        ? a.views.period
        : sortBy === "reactions"
          ? a.reactions.period
          : a.comments.period;
    const bVal =
      sortBy === "views"
        ? b.views.period
        : sortBy === "reactions"
          ? b.reactions.period
          : b.comments.period;
    return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (column: "views" | "reactions" | "comments") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <>
      <TableContainer>
        <AnalyticsTable>
          <thead>
            <tr>
              <TableHeader style={{ width: "40%" }}>Post</TableHeader>
              <TableHeader style={{ width: "12%" }}>Status</TableHeader>
              <SortableHeader onClick={() => toggleSort("views")} $active={sortBy === "views"}>
                Views ({days}d)
                {sortBy === "views" &&
                  (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
              </SortableHeader>
              <SortableHeader
                onClick={() => toggleSort("reactions")}
                $active={sortBy === "reactions"}
              >
                Reactions ({days}d)
                {sortBy === "reactions" &&
                  (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
              </SortableHeader>
              <SortableHeader
                onClick={() => toggleSort("comments")}
                $active={sortBy === "comments"}
              >
                Comments ({days}d)
                {sortBy === "comments" &&
                  (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
              </SortableHeader>
              <TableHeader>Reaction Breakdown</TableHeader>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map((post: any) => (
              <TableRow key={post._id}>
                <TableCell>
                  <PostCellContent>
                    <PostCellIcon>
                      {post.contentType === "video" ? (
                        <Play size={14} />
                      ) : post.contentType === "news" ? (
                        <Newspaper size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                    </PostCellIcon>
                    <div>
                      <PostCellTitle>{post.title}</PostCellTitle>
                      <PostCellSlug>/{post.slug}</PostCellSlug>
                    </div>
                  </PostCellContent>
                </TableCell>
                <TableCell>
                  <StatusBadge $status={post.status}>{post.status}</StatusBadge>
                </TableCell>
                <TableCell>
                  <CellValue>{post.views.period.toLocaleString()}</CellValue>
                  <CellSubvalue>({post.views.total.toLocaleString()} total)</CellSubvalue>
                </TableCell>
                <TableCell>
                  <CellValue>{post.reactions.period.toLocaleString()}</CellValue>
                  <CellSubvalue>({post.reactions.total.toLocaleString()} total)</CellSubvalue>
                </TableCell>
                <TableCell>
                  <CellValue>{post.comments.period.toLocaleString()}</CellValue>
                  <CellSubvalue>({post.comments.total.toLocaleString()} total)</CellSubvalue>
                </TableCell>
                <TableCell>
                  <ReactionBadges>
                    <ReactionMini $color={CHART_COLORS.like}>
                      <ThumbsUp size={10} /> {post.reactions.like}
                    </ReactionMini>
                    <ReactionMini $color={CHART_COLORS.helpful}>
                      <Heart size={10} /> {post.reactions.helpful}
                    </ReactionMini>
                    <ReactionMini $color={CHART_COLORS.insightful}>
                      <Lightbulb size={10} /> {post.reactions.insightful}
                    </ReactionMini>
                  </ReactionBadges>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </AnalyticsTable>
      </TableContainer>
    </>
  );
}

// Posts Tab - matches Learn homepage structure with separate news and content sections
function PostsTab() {
  const posts = useQuery(api.blogPosts.list);
  const updateBentoLayout = useMutation(api.blogPosts.updateBentoLayout);
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [localPosts, setLocalPosts] = useState<AdminBentoCardProps[]>([]);
  const [saving, setSaving] = useState(false);

  const deletePost = useMutation(api.blogPosts.deletePost);
  const publishPost = useMutation(api.blogPosts.publish);
  const unpublishPost = useMutation(api.blogPosts.unpublish);
  const archivePost = useMutation(api.blogPosts.archive);

  // Transform posts to AdminBentoCardProps and sort by bentoOrder
  useEffect(() => {
    if (posts) {
      const sorted = [...posts].sort((a, b) => a.bentoOrder - b.bentoOrder);
      const transformed: AdminBentoCardProps[] = sorted.map((p) => ({
        _id: p._id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        contentType: p.contentType,
        coverImage: p.coverImage,
        youtubeId: p.youtubeId,
        labels: p.labels,
        difficulty: p.difficulty,
        readTimeMins: p.readTimeMins,
        bentoSize: p.bentoSize,
        viewCount: p.viewCount ?? 0,
        publishedAt: p.publishedAt,
        status: p.status,
      }));
      setLocalPosts(transformed);
    }
  }, [posts]);

  // Filter posts based on current filter, then split into news vs content
  const filteredPosts = localPosts.filter((post) => {
    if (filter === "all") return true;
    return post.status === filter;
  });

  // Split into news and content (articles/videos) - matching Learn homepage
  const newsPosts = filteredPosts.filter((post) => post.contentType === "news");
  const contentPosts = filteredPosts.filter((post) => post.contentType !== "news");

  // Auto-save function for reorder/size changes
  const autoSave = async (updatedPosts: AdminBentoCardProps[]) => {
    setSaving(true);
    try {
      const updates = updatedPosts.map((post, index) => ({
        postId: post._id,
        bentoOrder: index,
        bentoSize: post.bentoSize,
      }));
      await updateBentoLayout({ updates });
    } finally {
      setSaving(false);
    }
  };

  const handleNewsReorder = (reorderedNews: AdminBentoCardProps[]) => {
    const allPosts = [...reorderedNews, ...contentPosts];
    setLocalPosts(allPosts);
    autoSave(allPosts);
  };

  const handleContentReorder = (reorderedContent: AdminBentoCardProps[]) => {
    const allPosts = [...newsPosts, ...reorderedContent];
    setLocalPosts(allPosts);
    autoSave(allPosts);
  };

  const handleSizeChange = (postId: string, size: AdminBentoCardProps["bentoSize"]) => {
    const newPosts = localPosts.map((p) => (p._id === postId ? { ...p, bentoSize: size } : p));
    setLocalPosts(newPosts);
    autoSave(newPosts);
  };

  const handleEdit = (postId: string) => {
    const post = posts?.find((p) => p._id === postId);
    if (post) setEditingPost(post);
  };

  const handleDelete = (postId: string) => {
    if (confirm("Delete this post?")) {
      deletePost({ postId: postId as Id<"blogPosts"> });
    }
  };

  const handlePublish = (postId: string) => {
    publishPost({ postId: postId as Id<"blogPosts"> });
  };

  const handleUnpublish = (postId: string) => {
    unpublishPost({ postId: postId as Id<"blogPosts"> });
  };

  const handleArchive = (postId: string) => {
    archivePost({ postId: postId as Id<"blogPosts"> });
  };

  if (editingPost || isCreating) {
    return (
      <PostEditor
        post={editingPost}
        onClose={() => {
          setEditingPost(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <TabPanel>
      <PostsHeader>
        <FilterGroup>
          <FilterButton $active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterButton>
          <FilterButton $active={filter === "published"} onClick={() => setFilter("published")}>
            Published
          </FilterButton>
          <FilterButton $active={filter === "draft"} onClick={() => setFilter("draft")}>
            Drafts
          </FilterButton>
          <FilterButton $active={filter === "archived"} onClick={() => setFilter("archived")}>
            Archived
          </FilterButton>
        </FilterGroup>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {saving && <SavingIndicator>Saving...</SavingIndicator>}
          <ActionButton onClick={() => setIsCreating(true)}>
            <Plus size={16} /> New Post
          </ActionButton>
        </div>
      </PostsHeader>

      <LayoutHint>
        Drag posts to reorder. Click S/M/L/B/F to change size. Changes save automatically.
      </LayoutHint>

      {!posts ? (
        <p style={{ padding: "0 24px" }}>Loading posts...</p>
      ) : (
        <>
          {/* NEWS SECTION - compact flex layout on top, matching Learn homepage */}
          {newsPosts.length > 0 && (
            <AdminSection>
              <AdminSectionHeader>news</AdminSectionHeader>
              <DraggableBentoGrid
                posts={newsPosts}
                onReorder={handleNewsReorder}
                onSizeChange={handleSizeChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                onArchive={handleArchive}
                compact
              />
            </AdminSection>
          )}

          {/* CONTENT SECTION - 5-column bento grid, matching Learn homepage */}
          <AdminSection>
            <AdminSectionHeader>content</AdminSectionHeader>
            <DraggableBentoGrid
              posts={contentPosts}
              onReorder={handleContentReorder}
              onSizeChange={handleSizeChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onArchive={handleArchive}
              emptyMessage={
                <>
                  <h2
                    style={{ margin: "0 0 8px", fontSize: "24px", fontFamily: "var(--font-sans)" }}
                  >
                    No {filter === "all" ? "" : filter} content
                  </h2>
                  <p style={{ margin: 0, fontSize: "16px", opacity: 0.7 }}>
                    {filter === "all"
                      ? "Create your first post to get started"
                      : `No ${filter} posts found`}
                  </p>
                </>
              }
            />
          </AdminSection>
        </>
      )}
    </TabPanel>
  );
}

// Post Editor Component
export function PostEditor({ post, onClose }: { post: BlogPost | null; onClose: () => void }) {
  const { isCreator } = useTierAccess();
  const createPost = useMutation(api.blogPosts.create);
  const updatePost = useMutation(api.blogPosts.update);
  const updateCollaborators = useMutation(api.blogPosts.updateCollaborators);

  // Collaborators state - extract IDs from collaborator objects
  const [collaboratorIds, setCollaboratorIds] = useState<Id<"users">[]>(
    (post?.collaborators?.map((c: { _id: Id<"users"> } | Id<"users">) =>
      typeof c === "object" && c !== null && "_id" in c ? c._id : c,
    ) as Id<"users">[]) || [],
  );
  const [collaboratorSearch, setCollaboratorSearch] = useState("");
  const [showCollaboratorPicker, setShowCollaboratorPicker] = useState(false);
  const [savingCollaborators, setSavingCollaborators] = useState(false);
  const collaboratorInputRef = useRef<HTMLInputElement>(null);

  // Search users query
  const searchResults = useQuery(
    api.users.searchUsers,
    collaboratorSearch.length > 0 ? { query: collaboratorSearch, limit: 10 } : "skip",
  );

  // Get collaborator details for display
  const collaboratorDetails = useQuery(
    api.users.getUsersByIds,
    collaboratorIds.length > 0 ? { userIds: collaboratorIds } : "skip",
  );

  // Filter out already selected collaborators and the post author from search results
  const filteredSearchResults = useMemo(() => {
    if (!searchResults) return [];
    return searchResults.filter(
      (user) => !collaboratorIds.includes(user._id) && user._id !== post?.authorId,
    );
  }, [searchResults, collaboratorIds, post?.authorId]);

  // Add collaborator
  const handleAddCollaborator = useCallback(
    async (userId: Id<"users">) => {
      if (!post) return;
      const newIds = [...collaboratorIds, userId];
      setCollaboratorIds(newIds);
      setCollaboratorSearch("");
      setShowCollaboratorPicker(false);

      setSavingCollaborators(true);
      try {
        await updateCollaborators({ postId: post._id, collaborators: newIds });
      } catch (error) {
        console.error("Failed to add collaborator:", error);
        setCollaboratorIds(collaboratorIds); // Revert on error
      } finally {
        setSavingCollaborators(false);
      }
    },
    [post, collaboratorIds, updateCollaborators],
  );

  // Remove collaborator
  const handleRemoveCollaborator = useCallback(
    async (userId: Id<"users">) => {
      if (!post) return;
      const newIds = collaboratorIds.filter((id) => id !== userId);
      setCollaboratorIds(newIds);

      setSavingCollaborators(true);
      try {
        await updateCollaborators({ postId: post._id, collaborators: newIds });
      } catch (error) {
        console.error("Failed to remove collaborator:", error);
        setCollaboratorIds(collaboratorIds); // Revert on error
      } finally {
        setSavingCollaborators(false);
      }
    },
    [post, collaboratorIds, updateCollaborators],
  );

  const [form, setForm] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    description: post?.description || "",
    content: post?.content || "",
    contentType: post?.contentType || ("article" as const),
    coverImage: post?.coverImage || "",
    coverAuthor: post?.coverAuthor || "",
    coverAuthorUrl: post?.coverAuthorUrl || "",
    coverGradientIntensity: post?.coverGradientIntensity ?? 100,
    youtubeId: post?.youtubeId || "",
    labels: post?.labels?.join(", ") || "",
    difficulty: post?.difficulty || "",
    readTimeMins: post?.readTimeMins?.toString() || "",
    visibility: post?.visibility || ("public" as const),
    bentoSize: post?.bentoSize || ("medium" as const),
    aiDisclosureStatus: post?.aiDisclosureStatus || "",
  });

  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/blog/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, filename: file.name }),
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      setForm((f) => ({ ...f, coverImage: url }));
    } catch (error) {
      console.error("Failed to upload cover:", error);
      alert("Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        title: form.title,
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: form.description,
        content: form.content,
        contentType: form.contentType as "article" | "video" | "news",
        coverImage: form.coverImage || undefined,
        coverAuthor: form.coverAuthor || undefined,
        coverAuthorUrl: form.coverAuthorUrl || undefined,
        coverGradientIntensity: form.coverGradientIntensity,
        youtubeId: form.youtubeId || undefined,
        labels: form.labels
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        difficulty: (form.difficulty || undefined) as
          | "beginner"
          | "intermediate"
          | "advanced"
          | undefined,
        readTimeMins: form.readTimeMins ? Number.parseInt(form.readTimeMins) : undefined,
        visibility: form.visibility as "public" | "members" | "tier1" | "tier2",
        bentoSize: form.bentoSize as "small" | "medium" | "large" | "banner" | "featured",
        aiDisclosureStatus: (form.aiDisclosureStatus || undefined) as
          | "none"
          | "llm-assisted"
          | "llm-reviewed"
          | undefined,
      };

      if (post) {
        await updatePost({ postId: post._id, ...data });
      } else {
        await createPost(data);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TabPanel>
      <EditorHeader>
        <h2>{post ? "Edit Post" : "New Post"}</h2>
        <EditorActions>
          <ActionButton onClick={onClose} $secondary>
            Cancel
          </ActionButton>
          <ActionButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </ActionButton>
        </EditorActions>
      </EditorHeader>

      <EditorForm>
        <FormRow>
          <FormGroup>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Post title"
            />
          </FormGroup>
          <FormGroup>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="url-friendly-slug"
            />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label>Description</Label>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description"
          />
        </FormGroup>

        <FormRow>
          <FormGroup>
            <Label>Content Type</Label>
            <Select
              value={form.contentType}
              onChange={(e) =>
                setForm({ ...form, contentType: e.target.value as typeof form.contentType })
              }
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="news">News</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Visibility</Label>
            <Select
              value={form.visibility}
              onChange={(e) =>
                setForm({ ...form, visibility: e.target.value as typeof form.visibility })
              }
            >
              <option value="public">Public</option>
              <option value="members">Members Only</option>
              <option value="tier1">Tier 1+</option>
              <option value="tier2">Tier 2 Only</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Bento Size</Label>
            <Select
              value={form.bentoSize}
              onChange={(e) =>
                setForm({ ...form, bentoSize: e.target.value as typeof form.bentoSize })
              }
            >
              <option value="small">Small (3 cols)</option>
              <option value="medium">Medium (4 cols)</option>
              <option value="large">Large (6 cols)</option>
              <option value="banner">Banner (12 cols)</option>
              <option value="featured">Featured (8 cols)</option>
            </Select>
          </FormGroup>
        </FormRow>

        {form.contentType === "video" && (
          <FormGroup>
            <Label>YouTube Video ID</Label>
            <Input
              value={form.youtubeId}
              onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
              placeholder="e.g., dQw4w9WgXcQ"
            />
          </FormGroup>
        )}

        <FormRow>
          <FormGroup style={{ flex: 2 }}>
            <Label>Cover Image</Label>
            <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
              <Input
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder="https://... or upload"
                style={{ flex: 1 }}
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 16px",
                  background: uploadingCover
                    ? "rgba(165, 163, 245, 0.1)"
                    : "rgba(165, 163, 245, 0.15)",
                  color: "#a5a3f5",
                  borderRadius: "6px",
                  cursor: uploadingCover ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {uploadingCover ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            {form.coverImage && (
              <div
                style={{
                  marginTop: "8px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  maxHeight: "120px",
                }}
              >
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  style={{ width: "100%", height: "120px", objectFit: "cover" }}
                />
              </div>
            )}
          </FormGroup>
          <FormGroup>
            <Label>Cover Author</Label>
            <Input
              value={form.coverAuthor}
              onChange={(e) => setForm({ ...form, coverAuthor: e.target.value })}
              placeholder="Photo by..."
            />
          </FormGroup>
          <FormGroup>
            <Label>Gradient Intensity ({form.coverGradientIntensity}%)</Label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.coverGradientIntensity}
              onChange={(e) => setForm({ ...form, coverGradientIntensity: Number(e.target.value) })}
              style={{ width: "100%", marginTop: "8px" }}
            />
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label>Labels (comma-separated)</Label>
            <Input
              value={form.labels}
              onChange={(e) => setForm({ ...form, labels: e.target.value })}
              placeholder="react, typescript, nextjs"
            />
          </FormGroup>
          <FormGroup>
            <Label>Difficulty</Label>
            <Select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              <option value="">None</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Read Time (mins)</Label>
            <Input
              type="number"
              value={form.readTimeMins}
              onChange={(e) => setForm({ ...form, readTimeMins: e.target.value })}
              placeholder="5"
            />
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label>AI Disclosure</Label>
            <Select
              value={form.aiDisclosureStatus}
              onChange={(e) => setForm({ ...form, aiDisclosureStatus: e.target.value })}
            >
              <option value="">Auto (based on date)</option>
              <option value="none">No AI Involvement</option>
              <option value="llm-reviewed">AI-Reviewed (formatting/review only)</option>
              <option value="llm-assisted">AI-Assisted (less than 10% content)</option>
            </Select>
            <FieldHint>
              Posts before Nov 30, 2022 default to &quot;No AI&quot;.{" "}
              <a href="/ai-disclosure" target="_blank" rel="noopener noreferrer">
                Learn more
              </a>
            </FieldHint>
          </FormGroup>
        </FormRow>

        {/* Collaborators Section - Only visible to creator for existing posts */}
        {isCreator && post && (
          <CollaboratorsSection>
            <CollaboratorsHeader>
              <CollaboratorsTitle>
                <Users size={16} />
                Collaborators
                {savingCollaborators && <SavingIndicator>Saving...</SavingIndicator>}
              </CollaboratorsTitle>
              <CollaboratorsDescription>
                Collaborators can edit this post. Only you can manage collaborators.
              </CollaboratorsDescription>
            </CollaboratorsHeader>

            {/* Current Collaborators */}
            <CollaboratorsList>
              {collaboratorDetails && collaboratorDetails.length > 0 ? (
                collaboratorDetails.map((user) => (
                  <CollaboratorChip key={user._id}>
                    {user.avatarUrl ? (
                      <CollaboratorAvatar src={user.avatarUrl} alt={user.displayName} />
                    ) : (
                      <CollaboratorAvatarPlaceholder>
                        {user.displayName.charAt(0).toUpperCase()}
                      </CollaboratorAvatarPlaceholder>
                    )}
                    <CollaboratorName>{user.displayName}</CollaboratorName>
                    <RemoveCollaboratorButton
                      onClick={() => handleRemoveCollaborator(user._id)}
                      title="Remove collaborator"
                    >
                      <X size={14} />
                    </RemoveCollaboratorButton>
                  </CollaboratorChip>
                ))
              ) : (
                <NoCollaborators>No collaborators yet</NoCollaborators>
              )}
            </CollaboratorsList>

            {/* Add Collaborator */}
            <CollaboratorPickerWrapper>
              <CollaboratorSearchInput
                ref={collaboratorInputRef}
                value={collaboratorSearch}
                onChange={(e) => {
                  setCollaboratorSearch(e.target.value);
                  setShowCollaboratorPicker(true);
                }}
                onFocus={() => setShowCollaboratorPicker(true)}
                placeholder="Search users to add..."
              />
              <SearchIcon>
                <Search size={16} />
              </SearchIcon>

              {/* Search Results Dropdown */}
              {showCollaboratorPicker && collaboratorSearch.length > 0 && (
                <CollaboratorDropdown>
                  {filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map((user) => (
                      <CollaboratorOption
                        key={user._id}
                        onClick={() => handleAddCollaborator(user._id)}
                      >
                        {user.avatarUrl ? (
                          <CollaboratorAvatar src={user.avatarUrl} alt={user.displayName} />
                        ) : (
                          <CollaboratorAvatarPlaceholder>
                            {user.displayName.charAt(0).toUpperCase()}
                          </CollaboratorAvatarPlaceholder>
                        )}
                        <CollaboratorOptionInfo>
                          <CollaboratorOptionName>{user.displayName}</CollaboratorOptionName>
                          {user.username && (
                            <CollaboratorOptionUsername>
                              @{user.username}
                            </CollaboratorOptionUsername>
                          )}
                        </CollaboratorOptionInfo>
                        <UserPlus size={16} />
                      </CollaboratorOption>
                    ))
                  ) : (
                    <NoResults>No users found</NoResults>
                  )}
                </CollaboratorDropdown>
              )}
            </CollaboratorPickerWrapper>
          </CollaboratorsSection>
        )}

        <FormGroup style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Label>Content (MDX)</Label>
          <MDXEditor
            initialContent={form.content}
            onChange={(mdx) => setForm({ ...form, content: mdx })}
            placeholder="Start writing... Type '/' for commands"
          />
        </FormGroup>
      </EditorForm>
    </TabPanel>
  );
}

// Migration Tab
function MigrationTab() {
  const status = useQuery(api.blogMigration.getMigrationStatus);
  const migrateFromGitHub = useAction(api.blogMigration.migrateFromGitHub);
  const clearAllPosts = useAction(api.blogMigration.clearAllPosts);
  const getCreatorId = useQuery(api.blogMigration.getCreatorId);
  const [migrating, setMigrating] = useState(false);

  const handleMigrate = async () => {
    if (!getCreatorId) {
      alert("Could not find creator user. Make sure you have a user in the database.");
      return;
    }
    setMigrating(true);
    try {
      await migrateFromGitHub({ clerkId: getCreatorId });
      alert("Migration complete!");
    } catch (error) {
      console.error("Migration failed:", error);
      alert("Migration failed. Check console.");
    } finally {
      setMigrating(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("This will delete ALL blog posts. Are you sure?")) return;
    await clearAllPosts();
  };

  return (
    <TabPanel>
      <SectionTitle>Migration from GitHub</SectionTitle>
      <Text>Migrate your existing blog posts from the GitHub repository to Convex.</Text>

      {status && (
        <StatsGrid>
          <StatCard>
            <StatValue>{status.migratedCount}</StatValue>
            <StatLabel>Posts in Convex</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

      <MigrationActions>
        <ActionButton onClick={handleMigrate} disabled={migrating}>
          <RefreshCw size={16} className={migrating ? "spin" : ""} />
          {migrating ? "Migrating..." : "Run Migration"}
        </ActionButton>
        <ActionButton onClick={handleClear} $danger>
          <Trash2 size={16} />
          Clear All Posts
        </ActionButton>
      </MigrationActions>

      <WarningBox>
        <strong>Note:</strong> The migration will fetch posts from the GitHub repo and create them
        in Convex. Existing posts with the same slug will be skipped.
      </WarningBox>
    </TabPanel>
  );
}

// Discord Tab - Comment Sync Info
function DiscordTab() {
  return (
    <TabPanel>
      <SectionTitle>Discord Comment Sync</SectionTitle>
      <Text>Comments from your website are automatically synced to Discord article threads.</Text>

      <InfoBox>
        <strong>How it works:</strong>
        <ul>
          <li>
            When a user comments on a blog post, it&apos;s posted to the article&apos;s Discord
            thread
          </li>
          <li>Comments appear with the user&apos;s display name and avatar via webhook</li>
          <li>Configure the webhook URL in each channel&apos;s settings (article, video, news)</li>
          <li>The bot creates threads when publishing, webhooks post comments to those threads</li>
        </ul>
      </InfoBox>
    </TabPanel>
  );
}

// Styled Components
const Container = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const AdminContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 0;
`;

const Header = styled.div`
  margin-bottom: 24px;
  padding: 0 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
  margin: 0 0 8px;
`;

const Text = styled.p`
  color: ${(p) => p.theme.textColor};
  margin: 0;
`;

const TabBar = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 1px solid ${(p) => p.theme.borderColor || "#333"};
  padding: 0 24px 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: ${(p) => (p.$active ? p.theme.contrast : "transparent")};
  color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? p.theme.contrast : p.theme.borderColor || "#333")};
  }
`;

const TabContent = styled.div`
  width: 100%;
`;

const TabPanel = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0 0 16px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${(p) => p.theme.textColor};
  margin-top: 4px;
`;

const PostListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 8px;
`;

const PostRank = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.textColor};
  width: 32px;
`;

const PostInfo = styled.div`
  flex: 1;
`;

const PostTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${(p) => p.theme.contrast};
`;

const PostMeta = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
`;

const PostsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 24px;
  flex-wrap: wrap;
  gap: 12px;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${(p) => (p.$active ? p.theme.contrast : p.theme.borderColor || "#333")};
  border-radius: 6px;
  background: ${(p) => (p.$active ? p.theme.contrast : "transparent")};
  color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${(p) => p.theme.contrast};
  }
`;

const ActionButton = styled.button<{ $secondary?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: ${(p) =>
    p.$danger ? "#ef4444" : p.$secondary ? p.theme.borderColor || "#333" : p.theme.contrast};
  color: ${(p) => (p.$secondary ? p.theme.contrast : p.theme.background)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const PostCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 10px;
`;

const PostCardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PostCardIcon = styled.div`
  color: ${(p) => p.theme.textColor};
`;

const PostCardInfo = styled.div``;

const PostCardTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${(p) => p.theme.contrast};
`;

const PostCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  margin-top: 4px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  background: ${(p) =>
    p.$status === "published" ? "#22c55e" : p.$status === "draft" ? "#f59e0b" : "#6b7280"};
  color: white;
`;

const PostCardActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button<{ $danger?: boolean; $success?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${(p) => (p.$danger ? "#ef4444" : p.$success ? "#22c55e" : p.theme.textColor)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => p.theme.background};
  }

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${(p) => p.theme.textColor};
`;

// Editor Styles
const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    color: ${(p) => p.theme.contrast};
  }
`;

const EditorActions = styled.div`
  display: flex;
  gap: 8px;
`;

const EditorForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow: auto;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${(p) => p.theme.textColor};
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${(p) => p.theme.borderColor || "#333"};
  border-radius: 8px;
  background: ${(p) => p.theme.background};
  color: ${(p) => p.theme.contrast};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.contrast};
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${(p) => p.theme.borderColor || "#333"};
  border-radius: 8px;
  background: ${(p) => p.theme.background};
  color: ${(p) => p.theme.contrast};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.contrast};
  }
`;

const FieldHint = styled.p`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  margin: 4px 0 0 0;
  opacity: 0.7;

  a {
    color: ${(p) => p.theme.linkColor || "#7c7ce0"};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid ${(p) => p.theme.borderColor || "#333"};
  border-radius: 8px;
  background: ${(p) => p.theme.background};
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  font-family: "JetBrains Mono", monospace;
  resize: vertical;
  min-height: 300px;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.contrast};
  }
`;

// Bento Layout Styles
const LayoutHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const LayoutHint = styled.p`
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  margin: 0 0 20px;
  padding: 0 24px;
`;

// Admin section styling - matches Learn homepage
const AdminSection = styled.div`
  margin-bottom: 40px;
`;

const AdminSectionHeader = styled.h2`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
  margin: 0 0 16px;
  padding: 0 24px;
`;

const SavingIndicator = styled.span`
  font-size: 13px;
  color: #9074f2;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    background: #9074f2;
    border-radius: 50%;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;

const BentoSectionLabel = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${(p) => p.theme.borderColor || "#333"};
`;

const EmptySection = styled.div`
  padding: 24px;
  text-align: center;
  color: ${(p) => p.theme.textColor};
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 10px;
  font-size: 14px;
  opacity: 0.7;
`;

// Migration Styles
const MigrationActions = styled.div`
  display: flex;
  gap: 12px;
  margin: 20px 0;
`;

const WarningBox = styled.div`
  padding: 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 14px;
`;

// ============================================
// DISCORD TAB STYLES
// ============================================

const DiscordSection = styled.div`
  margin-top: 24px;
  padding: 24px;
  background: ${(p) => p.theme.postBackground || "rgba(255, 255, 255, 0.03)"};
  border: 1px solid ${(p) => p.theme.borderColor || "#333"};
  border-radius: 12px;
`;

const WebhookInputContainer = styled.div`
  position: relative;
`;

const WebhookHint = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
  font-family: monospace;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-top: 1px solid ${(p) => p.theme.borderColor || "#333"};
  margin-top: 16px;
`;

const ToggleLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${(p) => p.theme.contrast};
`;

const Toggle = styled.button<{ $active: boolean }>`
  width: 48px;
  height: 26px;
  border-radius: 13px;
  border: none;
  background: ${(p) => (p.$active ? "#22c55e" : p.theme.borderColor || "#333")};
  cursor: pointer;
  position: relative;
  transition: background 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToggleKnob = styled.div<{ $active: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 3px;
  left: ${(p) => (p.$active ? "25px" : "3px")};
  transition: left 0.2s;
`;

const Message = styled.div<{ $type: "success" | "error" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 14px;
  background: ${(p) => (p.$type === "success" ? "#22c55e20" : "#ef444420")};
  color: ${(p) => (p.$type === "success" ? "#22c55e" : "#ef4444")};
  border: 1px solid ${(p) => (p.$type === "success" ? "#22c55e40" : "#ef444440")};
`;

const DiscordActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const InfoBox = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  color: ${(p) => p.theme.textColor};
  font-size: 14px;

  strong {
    color: ${(p) => p.theme.contrast};
  }

  ul {
    margin: 8px 0 0;
    padding-left: 20px;
  }

  li {
    margin: 4px 0;
  }
`;

// ============================================
// ANALYTICS DASHBOARD STYLES
// ============================================

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${(p) => p.theme.borderColor || "#333"};
  border-top-color: ${(p) => p.theme.contrast};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: ${(p) => p.theme.textColor};
`;

const AnalyticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const AnalyticsSubTabs = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const SubTab = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: ${(p) => (p.$active ? p.theme.contrast : "transparent")};
  color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? p.theme.contrast : p.theme.borderColor || "#333")};
  }
`;

const TimePeriodSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 8px;
  color: ${(p) => p.theme.textColor};
`;

const PeriodButton = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$active ? p.theme.contrast : "transparent")};
  color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? p.theme.contrast : "rgba(255,255,255,0.1)")};
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 24px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div<{ $color?: string }>`
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-left: 4px solid ${(p) => p.$color || p.theme.contrast};
`;

const MetricIcon = styled.div`
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
`;

const MetricContent = styled.div`
  flex: 1;
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
  line-height: 1.1;
`;

const MetricLabel = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  margin-top: 4px;
`;

const MetricChange = styled.div<{ $positive?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => (p.$positive ? "#10b981" : "#ef4444")};
  margin-top: 6px;
`;

const MetricSubtext = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
  margin-top: 4px;
`;

const ChartSection = styled.div`
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0;
`;

const ChartLegend = styled.div`
  display: flex;
  gap: 16px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
`;

const LegendDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
`;

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
`;

const LargeChartContainer = styled.div`
  height: 400px;
  width: 100%;
`;

const NoDataMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
  font-size: 14px;
`;

const BreakdownSection = styled.div`
  margin-bottom: 24px;
  overflow: hidden;
`;

const ReactionBreakdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ReactionBreakdownCard = styled.div<{ $color?: string }>`
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  border-top: 3px solid ${(p) => p.$color || p.theme.contrast};
`;

const ReactionIcon = styled.div`
  color: ${(p) => p.theme.textColor};
  margin-bottom: 8px;
`;

const ReactionCount = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
`;

const ReactionType = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  margin-top: 4px;
`;

const TopPostsSection = styled.div`
  margin-bottom: 24px;
  overflow: hidden;
`;

const TopPostsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TopPostsColumn = styled.div`
  min-width: 0;
  overflow: hidden;
`;

const TopPostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TopPostItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 8px;
  min-width: 0;
`;

const TopPostRank = styled.div<{ $top?: boolean }>`
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => (p.$top ? "#f59e0b" : p.theme.textColor)};
  width: 24px;
  flex-shrink: 0;
`;

const TopPostInfo = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const TopPostTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${(p) => p.theme.contrast};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TopPostValue = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.textColor};
  margin-top: 2px;
`;

const TopPostBar = styled.div`
  width: 60px;
  height: 6px;
  background: ${(p) => p.theme.background};
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
`;

const TopPostBarFill = styled.div`
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const EmptyTopPosts = styled.div`
  padding: 20px;
  text-align: center;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
  font-size: 13px;
`;

// Table Styles for Posts Analytics
const TableContainer = styled.div`
  overflow-x: auto;
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 12px;
`;

const AnalyticsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 14px 16px;
  font-weight: 600;
  color: ${(p) => p.theme.textColor};
  border-bottom: 1px solid ${(p) => p.theme.background};
`;

const SortableHeader = styled(TableHeader)<{ $active?: boolean }>`
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${(p) => (p.$active ? p.theme.contrast : p.theme.textColor)};

  &:hover {
    color: ${(p) => p.theme.contrast};
  }
`;

const TableRow = styled.tr`
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid ${(p) => p.theme.background};
  color: ${(p) => p.theme.contrast};
  vertical-align: middle;
`;

const PostCellContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PostCellIcon = styled.div`
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
`;

const PostCellTitle = styled.div`
  font-weight: 500;
  color: ${(p) => p.theme.contrast};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
`;

const PostCellSlug = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
`;

const CellValue = styled.div`
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const CellSubvalue = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
`;

const ReactionBadges = styled.div`
  display: flex;
  gap: 6px;
`;

const ReactionMini = styled.div<{ $color?: string }>`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  background: ${(p) => `${p.$color}20` || "rgba(255,255,255,0.1)"};
  color: ${(p) => p.$color || p.theme.textColor};
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
`;

// Collaborators Section Styles
const CollaboratorsSection = styled.div`
  margin: 24px 0;
  padding: 20px;
  background: rgba(144, 116, 242, 0.05);
  border: 1px solid rgba(144, 116, 242, 0.2);
  border-radius: 12px;
`;

const CollaboratorsHeader = styled.div`
  margin-bottom: 16px;
`;

const CollaboratorsTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
`;

const CollaboratorsDescription = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
`;

const CollaboratorsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const CollaboratorChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
`;

const CollaboratorAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`;

const CollaboratorAvatarPlaceholder = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
`;

const CollaboratorName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${(p) => p.theme.contrast};
`;

const RemoveCollaboratorButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(255, 100, 100, 0.15);
  border-radius: 50%;
  color: rgba(255, 100, 100, 0.8);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 100, 100, 0.3);
    color: #ff6464;
  }
`;

const NoCollaborators = styled.span`
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
  font-style: italic;
`;

const CollaboratorPickerWrapper = styled.div`
  position: relative;
`;

const CollaboratorSearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  color: ${(p) => p.theme.contrast};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: rgba(144, 116, 242, 0.5);
  }

  &::placeholder {
    color: ${(p) => p.theme.textColor};
    opacity: 0.5;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
`;

const CollaboratorDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  max-height: 240px;
  overflow-y: auto;
  background: ${(p) => p.theme.background};
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 100;
`;

const CollaboratorOption = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: ${(p) => p.theme.contrast};
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.15);
  }

  svg {
    margin-left: auto;
    color: #a5a3f5;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover svg {
    opacity: 1;
  }
`;

const CollaboratorOptionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CollaboratorOptionName = styled.span`
  font-weight: 500;
`;

const CollaboratorOptionUsername = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
`;

const NoResults = styled.div`
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
`;
