import { useQuery as useRQ, useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  listBlogPosts,
  getBlogPostContent,
  createBlogPost,
  updateBlogPost,
  updateBentoLayout,
  updateCollaborators as updateCollaboratorsAction,
  deleteBlogPost,
  publishBlogPost,
  unpublishBlogPost,
  archiveBlogPost,
  getUsersByIds,
  getCreatorId,
  getDetailedAnalytics,
  getViewsOverTime,
  getReactionsOverTime,
  getCommentsOverTime,
  getAllPostsAnalytics,
  getMigrationStatus,
  searchUsers,
} from "@/src/db/client/admin-blog";
import { getMe } from "@/src/db/client/me";

const MDXEditor = dynamic(
  () => import("../../../components/editor/MDXEditor").then((mod) => mod.MDXEditor),
  {
    ssr: false,
    loading: () => <div style={{ padding: "20px", color: "#888" }}>Loading editor...</div>,
  },
);

import {
  Archive, ArrowDown, ArrowUp, BarChart3, Calendar, Edit2, Eye, EyeOff, FileText,
  Heart, Info, Lightbulb, Lock, MessageCircle, MessageSquare, Newspaper, Play, Plus,
  RefreshCw, Search, Send, ThumbsUp, Trash2, TrendingUp, UserPlus, Users, X,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BlogView } from "../../../components/layout/blog";
import { type AdminBentoCardProps } from "../../../components/learn/DraggableBentoGrid";
import { SimpleNavbar } from "../../../components/navbar/simple";

export const getServerSideProps = () => ({ props: {} });

type TabType = "analytics" | "posts" | "migration" | "discord";
type BlogPost = Awaited<ReturnType<typeof listBlogPosts>>[number];

export default function BlogAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const { data: me } = useRQ({ queryKey: ["me"], queryFn: () => getMe(), staleTime: 30_000 });
  const isCreator = me?.isCreator ?? false;
  const isLoading = me === undefined;

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || isLoading) {
    return (<BlogView><SimpleNavbar title="Blog Admin" /><Container><p>Loading...</p></Container></BlogView>);
  }

  if (!isCreator) {
    return (
      <>
        <Head><title>Access Denied | Blog Admin</title></Head>
        <BlogView>
          <SimpleNavbar title="Blog Admin" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don&apos;t have permission to access the blog admin panel.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head><title>Blog Admin | Nevulo</title></Head>
      <BlogView>
        <SimpleNavbar title="Blog Admin" />
        <AdminContainer>
          <Header>
            <Title>Blog Admin</Title>
            <Text>Manage your blog posts and layout</Text>
          </Header>
          <TabBar>
            <Tab $active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}><TrendingUp size={16} /> Analytics</Tab>
            <Tab $active={activeTab === "posts"} onClick={() => setActiveTab("posts")}><FileText size={16} /> Posts</Tab>
            <Tab $active={activeTab === "migration"} onClick={() => setActiveTab("migration")}><RefreshCw size={16} /> Migration</Tab>
            <Tab $active={activeTab === "discord"} onClick={() => setActiveTab("discord")}><MessageSquare size={16} /> Discord</Tab>
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

const CHART_COLORS = {
  primary: "#6366f1", secondary: "#8b5cf6", accent: "#ec4899", success: "#10b981",
  warning: "#f59e0b", like: "#ef4444", helpful: "#3b82f6", insightful: "#8b5cf6",
  comments: "#10b981", views: "#6366f1",
};

type TimePeriod = 7 | 30 | 90 | 180 | 365;
type AnalyticsSubTab = "overview" | "views" | "reactions" | "comments" | "posts";

function AnalyticsTab() {
  const [days, setDays] = useState<TimePeriod>(30);
  const [subTab, setSubTab] = useState<AnalyticsSubTab>("overview");
  const { data: detailedAnalytics } = useRQ({ queryKey: ["admin-blog", "analytics", days], queryFn: () => getDetailedAnalytics(days) });
  const { data: viewsOverTime } = useRQ({ queryKey: ["admin-blog", "views-over-time", days], queryFn: () => getViewsOverTime(days) });
  const { data: reactionsOverTime } = useRQ({ queryKey: ["admin-blog", "reactions-over-time", days], queryFn: () => getReactionsOverTime(days) });
  const { data: commentsOverTime } = useRQ({ queryKey: ["admin-blog", "comments-over-time", days], queryFn: () => getCommentsOverTime(days) });
  const { data: allPostsAnalytics } = useRQ({ queryKey: ["admin-blog", "all-posts-analytics", days], queryFn: () => getAllPostsAnalytics(days) });

  if (!detailedAnalytics) return (<TabPanel><LoadingContainer><LoadingSpinner /><LoadingText>Loading analytics...</LoadingText></LoadingContainer></TabPanel>);

  return (
    <TabPanel>
      <AnalyticsHeader>
        <AnalyticsSubTabs>
          <SubTab $active={subTab === "overview"} onClick={() => setSubTab("overview")}><BarChart3 size={14} /> Overview</SubTab>
          <SubTab $active={subTab === "views"} onClick={() => setSubTab("views")}><Eye size={14} /> Views</SubTab>
          <SubTab $active={subTab === "reactions"} onClick={() => setSubTab("reactions")}><Heart size={14} /> Reactions</SubTab>
          <SubTab $active={subTab === "comments"} onClick={() => setSubTab("comments")}><MessageCircle size={14} /> Comments</SubTab>
          <SubTab $active={subTab === "posts"} onClick={() => setSubTab("posts")}><FileText size={14} /> By Post</SubTab>
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
      {subTab === "overview" && <OverviewTab analytics={detailedAnalytics} viewsData={viewsOverTime} reactionsData={reactionsOverTime} commentsData={commentsOverTime} days={days} />}
      {subTab === "views" && <ViewsTab viewsData={viewsOverTime} analytics={detailedAnalytics} days={days} />}
      {subTab === "reactions" && <ReactionsTab reactionsData={reactionsOverTime} analytics={detailedAnalytics} days={days} />}
      {subTab === "comments" && <CommentsTab commentsData={commentsOverTime} analytics={detailedAnalytics} days={days} />}
      {subTab === "posts" && <PostsAnalyticsTab postsData={allPostsAnalytics} days={days} />}
    </TabPanel>
  );
}

function OverviewTab({ analytics, viewsData, reactionsData, commentsData, days }: { analytics: any; viewsData: any; reactionsData: any; commentsData: any; days: number }) {
  return (
    <>
      <MetricsGrid>
        <MetricCard $color={CHART_COLORS.views}><MetricIcon><Eye size={24} /></MetricIcon><MetricContent><MetricValue>{(analytics.totalViews ?? 0).toLocaleString()}</MetricValue><MetricLabel>Views ({days}d)</MetricLabel></MetricContent></MetricCard>
        <MetricCard $color={CHART_COLORS.like}><MetricIcon><Heart size={24} /></MetricIcon><MetricContent><MetricValue>{(analytics.totalReactions ?? 0).toLocaleString()}</MetricValue><MetricLabel>Reactions ({days}d)</MetricLabel></MetricContent></MetricCard>
        <MetricCard $color={CHART_COLORS.comments}><MetricIcon><MessageCircle size={24} /></MetricIcon><MetricContent><MetricValue>{(analytics.totalComments ?? 0).toLocaleString()}</MetricValue><MetricLabel>Comments ({days}d)</MetricLabel></MetricContent></MetricCard>
        <MetricCard $color={CHART_COLORS.secondary}><MetricIcon><FileText size={24} /></MetricIcon><MetricContent><MetricValue>{analytics.newPosts ?? 0}</MetricValue><MetricLabel>New Posts ({days}d)</MetricLabel></MetricContent></MetricCard>
      </MetricsGrid>
      <ChartSection>
        <ChartHeader><ChartTitle>Activity Overview</ChartTitle></ChartHeader>
        <ChartContainer>
          {viewsData && viewsData.length > 0 ? <CombinedChart viewsData={viewsData} reactionsData={reactionsData} commentsData={commentsData} /> : <NoDataMessage>No activity data for this period</NoDataMessage>}
        </ChartContainer>
      </ChartSection>
    </>
  );
}

function CombinedChart({ viewsData, reactionsData, commentsData }: { viewsData: any[]; reactionsData: any[]; commentsData: any[] }) {
  const data = useMemo(() => viewsData.map((d, i) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: d.count ?? d.views ?? 0,
    reactions: reactionsData?.[i]?.count ?? reactionsData?.[i]?.total ?? 0,
    comments: commentsData?.[i]?.count ?? commentsData?.[i]?.comments ?? 0,
  })), [viewsData, reactionsData, commentsData]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS.views} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_COLORS.views} stopOpacity={0} /></linearGradient>
          <linearGradient id="colorReactions" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS.like} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_COLORS.like} stopOpacity={0} /></linearGradient>
          <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS.comments} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_COLORS.comments} stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
        <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }} />
        <Legend />
        <Area type="monotone" dataKey="views" stroke={CHART_COLORS.views} fill="url(#colorViews)" strokeWidth={2} />
        <Area type="monotone" dataKey="reactions" stroke={CHART_COLORS.like} fill="url(#colorReactions)" strokeWidth={2} />
        <Area type="monotone" dataKey="comments" stroke={CHART_COLORS.comments} fill="url(#colorComments)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ViewsTab({ viewsData, analytics, days }: { viewsData: any; analytics: any; days: number }) {
  const chartData = useMemo(() => {
    if (!viewsData) return [];
    return viewsData.map((d: any) => ({ date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), views: d.count ?? d.views ?? 0 }));
  }, [viewsData]);
  const totalViews = viewsData?.reduce((sum: number, d: any) => sum + (d.count ?? d.views ?? 0), 0) || 0;
  const avgViews = viewsData?.length ? Math.round(totalViews / viewsData.length) : 0;
  const maxViews = viewsData?.reduce((max: number, d: any) => Math.max(max, d.count ?? d.views ?? 0), 0) || 0;

  return (
    <>
      <MetricsGrid>
        <MetricCard $color={CHART_COLORS.views}><MetricContent><MetricValue>{totalViews.toLocaleString()}</MetricValue><MetricLabel>Total Views</MetricLabel></MetricContent></MetricCard>
        <MetricCard $color={CHART_COLORS.secondary}><MetricContent><MetricValue>{avgViews.toLocaleString()}</MetricValue><MetricLabel>Avg/Day</MetricLabel></MetricContent></MetricCard>
        <MetricCard $color={CHART_COLORS.accent}><MetricContent><MetricValue>{maxViews.toLocaleString()}</MetricValue><MetricLabel>Peak Day</MetricLabel></MetricContent></MetricCard>
        <MetricCard $color={CHART_COLORS.success}><MetricContent><MetricValue>{totalViews.toLocaleString()}</MetricValue><MetricLabel>Total ({days}d)</MetricLabel></MetricContent></MetricCard>
      </MetricsGrid>
      <ChartSection>
        <ChartHeader><ChartTitle>Views Over Time</ChartTitle></ChartHeader>
        <LargeChartContainer>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorViewsLarge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS.views} stopOpacity={0.4} /><stop offset="95%" stopColor={CHART_COLORS.views} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="views" stroke={CHART_COLORS.views} fill="url(#colorViewsLarge)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoDataMessage>No views data for this period</NoDataMessage>}
        </LargeChartContainer>
      </ChartSection>
    </>
  );
}

function ReactionsTab({ reactionsData, analytics, days }: { reactionsData: any; analytics: any; days: number }) {
  const chartData = useMemo(() => {
    if (!reactionsData) return [];
    return reactionsData.map((d: any) => ({ date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), reactions: d.count ?? 0 }));
  }, [reactionsData]);
  const totalReactions = analytics.totalReactions ?? 0;

  return (
    <>
      <MetricsGrid>
        <MetricCard $color={CHART_COLORS.like}><MetricIcon><Heart size={24} /></MetricIcon><MetricContent><MetricValue>{totalReactions}</MetricValue><MetricLabel>Total Reactions ({days}d)</MetricLabel></MetricContent></MetricCard>
      </MetricsGrid>
      <ChartSection>
        <ChartHeader><ChartTitle>Reactions Over Time</ChartTitle></ChartHeader>
        <LargeChartContainer>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="reactions" fill={CHART_COLORS.like} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataMessage>No reactions data for this period</NoDataMessage>}
        </LargeChartContainer>
      </ChartSection>
    </>
  );
}

function CommentsTab({ commentsData, analytics, days }: { commentsData: any; analytics: any; days: number }) {
  const chartData = useMemo(() => {
    if (!commentsData) return [];
    return commentsData.map((d: any) => ({ date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), comments: d.count ?? d.comments ?? 0 }));
  }, [commentsData]);
  const totalComments = analytics.totalComments ?? 0;
  const avgComments = commentsData?.length ? Math.round(totalComments / commentsData.length) : 0;

  return (
    <>
      <MetricsGrid>
        <MetricCard $color={CHART_COLORS.comments}><MetricIcon><MessageCircle size={24} /></MetricIcon><MetricContent><MetricValue>{totalComments}</MetricValue><MetricLabel>Total Comments</MetricLabel></MetricContent></MetricCard>
        <MetricCard $color={CHART_COLORS.secondary}><MetricContent><MetricValue>{avgComments}</MetricValue><MetricLabel>Avg/Day</MetricLabel></MetricContent></MetricCard>
      </MetricsGrid>
      <ChartSection>
        <ChartHeader><ChartTitle>Comments Over Time</ChartTitle></ChartHeader>
        <LargeChartContainer>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="comments" fill={CHART_COLORS.comments} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataMessage>No comments data for this period</NoDataMessage>}
        </LargeChartContainer>
      </ChartSection>
    </>
  );
}

function PostsAnalyticsTab({ postsData, days }: { postsData: any; days: number }) {
  const [sortBy, setSortBy] = useState<"views" | "reactions" | "comments">("views");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  if (!postsData) return <LoadingContainer><LoadingText>Loading posts...</LoadingText></LoadingContainer>;

  const sortedPosts = [...postsData].sort((a: any, b: any) => {
    const aVal = sortBy === "views" ? (a.recentViews ?? 0) : sortBy === "reactions" ? (a.recentReactions ?? 0) : (a.recentComments ?? 0);
    const bVal = sortBy === "views" ? (b.recentViews ?? 0) : sortBy === "reactions" ? (b.recentReactions ?? 0) : (b.recentComments ?? 0);
    return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (column: "views" | "reactions" | "comments") => {
    if (sortBy === column) setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    else { setSortBy(column); setSortOrder("desc"); }
  };

  return (
    <TableContainer>
      <AnalyticsTable>
        <thead><tr>
          <TableHeader style={{ width: "40%" }}>Post</TableHeader>
          <SortableHeader onClick={() => toggleSort("views")} $active={sortBy === "views"}>Views ({days}d) {sortBy === "views" && (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}</SortableHeader>
          <SortableHeader onClick={() => toggleSort("reactions")} $active={sortBy === "reactions"}>Reactions ({days}d) {sortBy === "reactions" && (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}</SortableHeader>
          <SortableHeader onClick={() => toggleSort("comments")} $active={sortBy === "comments"}>Comments ({days}d) {sortBy === "comments" && (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}</SortableHeader>
          <TableHeader>Total Views</TableHeader>
        </tr></thead>
        <tbody>
          {sortedPosts.map((post: any) => (
            <TableRow key={post.id}>
              <TableCell><PostCellContent><PostCellIcon>{post.contentType === "video" ? <Play size={14} /> : post.contentType === "news" ? <Newspaper size={14} /> : <FileText size={14} />}</PostCellIcon><div><PostCellTitle>{post.title}</PostCellTitle><PostCellSlug>/{post.slug}</PostCellSlug></div></PostCellContent></TableCell>
              <TableCell><CellValue>{(post.recentViews ?? 0).toLocaleString()}</CellValue></TableCell>
              <TableCell><CellValue>{(post.recentReactions ?? 0).toLocaleString()}</CellValue></TableCell>
              <TableCell><CellValue>{(post.recentComments ?? 0).toLocaleString()}</CellValue></TableCell>
              <TableCell><CellSubvalue>{(post.viewCount ?? 0).toLocaleString()}</CellSubvalue></TableCell>
            </TableRow>
          ))}
        </tbody>
      </AnalyticsTable>
    </TableContainer>
  );
}

function PostsTab() {
  const queryClient = useQueryClient();
  const { data: posts } = useRQ({ queryKey: ["admin-blog", "posts"], queryFn: () => listBlogPosts() });
  const updateBentoLayoutMut = useMutation({ mutationFn: (args: { updates: Array<{ id: number; bentoSize: string; bentoOrder: number }> }) => updateBentoLayout(args.updates), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog", "posts"] }) });
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const deletePostMut = useMutation({ mutationFn: (id: number) => deleteBlogPost(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog", "posts"] }) });
  const publishPostMut = useMutation({ mutationFn: (id: number) => publishBlogPost(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog", "posts"] }) });
  const unpublishPostMut = useMutation({ mutationFn: (id: number) => unpublishBlogPost(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog", "posts"] }) });
  const archivePostMut = useMutation({ mutationFn: (id: number) => archiveBlogPost(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog", "posts"] }) });

  const sortedPosts = posts ? [...posts].sort((a, b) => new Date(b.publishedAt ?? b.createdAt ?? 0).getTime() - new Date(a.publishedAt ?? a.createdAt ?? 0).getTime()) : [];
  const filteredPosts = sortedPosts.filter((post) => filter === "all" || post.status === filter);

  const handleSizeChange = async (postId: number, size: AdminBentoCardProps["bentoSize"]) => {
    setSaving(true);
    try { await updateBentoLayoutMut.mutateAsync({ updates: [{ id: postId, bentoSize: size, bentoOrder: 0 }] }); }
    finally { setSaving(false); }
  };

  if (editingPost || isCreating) return <PostEditor post={editingPost} onClose={() => { setEditingPost(null); setIsCreating(false); }} />;

  return (
    <TabPanel>
      <PostsHeader>
        <FilterGroup>
          <FilterButton $active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
          <FilterButton $active={filter === "published"} onClick={() => setFilter("published")}>Published</FilterButton>
          <FilterButton $active={filter === "draft"} onClick={() => setFilter("draft")}>Drafts</FilterButton>
          <FilterButton $active={filter === "archived"} onClick={() => setFilter("archived")}>Archived</FilterButton>
        </FilterGroup>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {saving && <SavingIndicator>Saving...</SavingIndicator>}
          <ActionButton onClick={() => setIsCreating(true)}><Plus size={16} /> New Post</ActionButton>
        </div>
      </PostsHeader>
      <LayoutHint>Click S/M/L/B/F to change size. Posts sorted by most recent first.</LayoutHint>
      {!posts ? <p style={{ padding: "0 24px" }}>Loading posts...</p> : filteredPosts.length === 0 ? (
        <EmptyPostsState><h2>No {filter === "all" ? "" : filter} posts</h2><p>{filter === "all" ? "Create your first post to get started" : `No ${filter} posts found`}</p></EmptyPostsState>
      ) : (
        <AdminPostsList>
          {filteredPosts.map((post) => (
            <AdminPostCard key={post.id}>
              <AdminPostCardInner href={`/learn/${post.slug}`} target="_blank" onClick={(e) => e.preventDefault()}>
                {post.coverImage || post.youtubeId ? (
                  <AdminPostImage>
                    <img src={post.youtubeId ? `https://img.youtube.com/vi/${post.youtubeId}/mqdefault.jpg` : (post.coverImage ?? undefined)} alt={post.title} />
                    {post.contentType === "video" && <VideoIndicator><Play size={16} /></VideoIndicator>}
                  </AdminPostImage>
                ) : (
                  <AdminPostImagePlaceholder>{post.contentType === "news" ? <Newspaper size={24} /> : <FileText size={24} />}</AdminPostImagePlaceholder>
                )}
                <AdminPostInfo>
                  <AdminPostTitle>{post.title}</AdminPostTitle>
                  <AdminPostMeta>
                    {post.difficulty && <DifficultyPill $difficulty={post.difficulty}>{post.difficulty}</DifficultyPill>}
                    {(post.labels as string[] | null)?.[0] && <LabelPill>{((post.labels as string[])[0]).replace(/-/g, " ")}</LabelPill>}
                    <TypePill $type={post.contentType}>{post.contentType}</TypePill>
                    <StatusPill $status={post.status ?? undefined}>{post.status}</StatusPill>
                  </AdminPostMeta>
                  <AdminPostDate>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Draft"}</AdminPostDate>
                </AdminPostInfo>
              </AdminPostCardInner>
              <AdminPostActions>
                <SizeButtons>
                  {(["small", "medium", "large", "banner", "featured"] as const).map((size) => (
                    <SizeBtn key={size} $active={post.bentoSize === size} onClick={() => handleSizeChange(post.id, size)}>{size.charAt(0).toUpperCase()}</SizeBtn>
                  ))}
                </SizeButtons>
                <ActionBtns>
                  <ActionBtn onClick={() => { const p = posts?.find((pp) => pp.id === post.id); if (p) setEditingPost(p); }} title="Edit"><Edit2 size={14} /></ActionBtn>
                  {post.status === "draft" && <ActionBtn onClick={() => publishPostMut.mutate(post.id)} title="Publish" $success><Send size={14} /></ActionBtn>}
                  {post.status === "published" && <ActionBtn onClick={() => unpublishPostMut.mutate(post.id)} title="Unpublish"><EyeOff size={14} /></ActionBtn>}
                  {post.status !== "archived" && <ActionBtn onClick={() => archivePostMut.mutate(post.id)} title="Archive"><Archive size={14} /></ActionBtn>}
                  <ActionBtn onClick={() => { if (confirm("Delete this post?")) deletePostMut.mutate(post.id); }} title="Delete" $danger><Trash2 size={14} /></ActionBtn>
                </ActionBtns>
              </AdminPostActions>
            </AdminPostCard>
          ))}
        </AdminPostsList>
      )}
    </TabPanel>
  );
}

export function PostEditor({ post, onClose }: { post: BlogPost | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: me } = useRQ({ queryKey: ["me"], queryFn: () => getMe(), staleTime: 30_000 });
  const isCreator = me?.isCreator ?? false;
  const createPostMut = useMutation({ mutationFn: (data: Parameters<typeof createBlogPost>[0]) => createBlogPost(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog", "posts"] }) });
  const updatePostMut = useMutation({ mutationFn: (args: { id: number; data: Parameters<typeof updateBlogPost>[1] }) => updateBlogPost(args.id, args.data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog", "posts"] }) });
  const updateCollaboratorsMut = useMutation({ mutationFn: (args: { postId: number; collaboratorIds: number[] }) => updateCollaboratorsAction(args.postId, args.collaboratorIds), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog", "posts"] }) });

  const { data: loadedContent } = useRQ({ queryKey: ["admin-blog", "post-content", post?.id], queryFn: () => getBlogPostContent(post!.id), enabled: !!post });

  const [collaboratorIds, setCollaboratorIds] = useState<number[]>((post?.collaborators ?? []) as number[]);
  const [collaboratorSearch, setCollaboratorSearch] = useState("");
  const [showCollaboratorPicker, setShowCollaboratorPicker] = useState(false);
  const [savingCollaborators, setSavingCollaborators] = useState(false);
  const collaboratorInputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults } = useRQ({ queryKey: ["admin-blog", "search-users", collaboratorSearch], queryFn: () => searchUsers(collaboratorSearch), enabled: collaboratorSearch.length >= 2 });
  const { data: collaboratorDetails } = useRQ({ queryKey: ["admin-blog", "collaborator-details", collaboratorIds], queryFn: () => getUsersByIds(collaboratorIds), enabled: collaboratorIds.length > 0 });

  const filteredSearchResults = useMemo(() => {
    if (!searchResults) return [];
    return searchResults.filter((user) => !collaboratorIds.includes(user.id) && user.id !== post?.authorId);
  }, [searchResults, collaboratorIds, post?.authorId]);

  const handleAddCollaborator = useCallback(async (userId: number) => {
    if (!post) return;
    const newIds = [...collaboratorIds, userId];
    setCollaboratorIds(newIds); setCollaboratorSearch(""); setShowCollaboratorPicker(false);
    setSavingCollaborators(true);
    try { await updateCollaboratorsMut.mutateAsync({ postId: post.id, collaboratorIds: newIds }); }
    catch (error) { console.error("Failed to add collaborator:", error); setCollaboratorIds(collaboratorIds); }
    finally { setSavingCollaborators(false); }
  }, [post, collaboratorIds, updateCollaboratorsMut]);

  const handleRemoveCollaborator = useCallback(async (userId: number) => {
    if (!post) return;
    const newIds = collaboratorIds.filter((id) => id !== userId);
    setCollaboratorIds(newIds);
    setSavingCollaborators(true);
    try { await updateCollaboratorsMut.mutateAsync({ postId: post.id, collaboratorIds: newIds }); }
    catch (error) { console.error("Failed to remove collaborator:", error); setCollaboratorIds(collaboratorIds); }
    finally { setSavingCollaborators(false); }
  }, [post, collaboratorIds, updateCollaboratorsMut]);

  const [form, setForm] = useState({
    title: post?.title || "", slug: post?.slug || "", description: post?.description || "", content: "",
    contentType: post?.contentType || ("article" as const), coverImage: post?.coverImage || "",
    coverAuthor: post?.coverAuthor || "", coverAuthorUrl: post?.coverAuthorUrl || "",
    coverGradientIntensity: post?.coverGradientIntensity ?? 100, youtubeId: post?.youtubeId || "",
    labels: (post?.labels as string[] | null)?.join(", ") || "", difficulty: post?.difficulty || "",
    readTimeMins: post?.readTimeMins?.toString() || "", visibility: post?.visibility || ("public" as const),
    bentoSize: post?.bentoSize || ("medium" as const), aiDisclosureStatus: post?.aiDisclosureStatus || "",
  });

  const [contentLoaded, setContentLoaded] = useState(!post);
  useEffect(() => { if (loadedContent !== undefined && !contentLoaded) { setForm((f) => ({ ...f, content: loadedContent ?? "" })); setContentLoaded(true); } }, [loadedContent, contentLoaded]);

  const [uploadingCover, setUploadingCover] = useState(false);
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingCover(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });
      const response = await fetch("/api/blog/upload-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: base64, filename: file.name }) });
      if (!response.ok) throw new Error("Upload failed");
      const { url } = await response.json();
      setForm((f) => ({ ...f, coverImage: url }));
    } catch (error) { console.error("Failed to upload cover:", error); alert("Failed to upload cover image"); }
    finally { setUploadingCover(false); }
  };

  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const labels = form.labels.split(",").map((l) => l.trim()).filter(Boolean);
      if (post) {
        await updatePostMut.mutateAsync({ id: post.id, data: {
          title: form.title, slug, description: form.description, body: form.content,
          contentType: form.contentType, coverImage: form.coverImage || null, coverAuthor: form.coverAuthor || null,
          coverAuthorUrl: form.coverAuthorUrl || null, coverGradientIntensity: form.coverGradientIntensity,
          youtubeId: form.youtubeId || null, labels, difficulty: form.difficulty || null,
          readTimeMins: form.readTimeMins ? Number.parseInt(form.readTimeMins) : null,
          visibility: form.visibility, bentoSize: form.bentoSize, aiDisclosureStatus: form.aiDisclosureStatus || null,
        }});
      } else {
        await createPostMut.mutateAsync({
          title: form.title, slug, description: form.description, body: form.content || undefined,
          contentType: form.contentType, coverImage: form.coverImage || undefined, coverAuthor: form.coverAuthor || undefined,
          coverAuthorUrl: form.coverAuthorUrl || undefined, coverGradientIntensity: form.coverGradientIntensity,
          youtubeId: form.youtubeId || undefined, labels, difficulty: form.difficulty || undefined,
          readTimeMins: form.readTimeMins ? Number.parseInt(form.readTimeMins) : undefined,
          visibility: form.visibility, bentoSize: form.bentoSize, aiDisclosureStatus: form.aiDisclosureStatus || undefined,
          authorId: me!.id,
        });
      }
      onClose();
    } catch (error) { console.error("Failed to save:", error); alert("Failed to save post"); }
    finally { setSaving(false); }
  };

  return (
    <TabPanel>
      <EditorHeader>
        <h2>{post ? "Edit Post" : "New Post"}</h2>
        <EditorActions>
          <ActionButton onClick={onClose} $secondary>Cancel</ActionButton>
          <ActionButton onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</ActionButton>
        </EditorActions>
      </EditorHeader>
      <EditorForm>
        <FormRow>
          <FormGroup><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" /></FormGroup>
          <FormGroup><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="url-friendly-slug" /></FormGroup>
        </FormRow>
        <FormGroup><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" /></FormGroup>
        <FormRow>
          <FormGroup><Label>Content Type</Label><Select value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value as typeof form.contentType })}><option value="article">Article</option><option value="video">Video</option><option value="news">News</option></Select></FormGroup>
          <FormGroup><Label>Bento Size</Label><Select value={form.bentoSize} onChange={(e) => setForm({ ...form, bentoSize: e.target.value as typeof form.bentoSize })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="banner">Banner</option><option value="featured">Featured</option></Select></FormGroup>
        </FormRow>
        <VisibilitySection>
          <FormGroup style={{ flex: 1, maxWidth: "300px" }}>
            <VisibilityLabel><Lock size={14} /> Access Visibility</VisibilityLabel>
            <VisibilitySelect value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as typeof form.visibility })} $restricted={form.visibility !== "public"}>
              <option value="public">Public - Anyone can view</option><option value="members">Members Only</option><option value="tier1">Super Legend - Tier 1+</option><option value="tier2">Super Legend II - Tier 2</option>
            </VisibilitySelect>
          </FormGroup>
          {form.visibility !== "public" && <VisibilityHint><Info size={14} /> Tier-restricted articles appear in <a href="/vault" target="_blank" rel="noopener">/vault</a></VisibilityHint>}
        </VisibilitySection>
        {form.contentType === "video" && <FormGroup><Label>YouTube Video ID</Label><Input value={form.youtubeId} onChange={(e) => setForm({ ...form, youtubeId: e.target.value })} placeholder="e.g., dQw4w9WgXcQ" /></FormGroup>}
        <FormRow>
          <FormGroup style={{ flex: 2 }}>
            <Label>Cover Image</Label>
            <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
              <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://... or upload" style={{ flex: 1 }} />
              <label style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", background: uploadingCover ? "rgba(165,163,245,0.1)" : "rgba(165,163,245,0.15)", color: "#a5a3f5", borderRadius: "6px", cursor: uploadingCover ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>
                {uploadingCover ? "Uploading..." : "Upload"}<input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} style={{ display: "none" }} />
              </label>
            </div>
            {form.coverImage && <div style={{ marginTop: "8px", borderRadius: "6px", overflow: "hidden", maxHeight: "120px" }}><img src={form.coverImage} alt="Cover preview" style={{ width: "100%", height: "120px", objectFit: "cover" }} /></div>}
          </FormGroup>
          <FormGroup><Label>Cover Author</Label><Input value={form.coverAuthor} onChange={(e) => setForm({ ...form, coverAuthor: e.target.value })} placeholder="Photo by..." /></FormGroup>
          <FormGroup><Label>Gradient Intensity ({form.coverGradientIntensity}%)</Label><input type="range" min="0" max="100" value={form.coverGradientIntensity} onChange={(e) => setForm({ ...form, coverGradientIntensity: Number(e.target.value) })} style={{ width: "100%", marginTop: "8px" }} /></FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup><Label>Labels (comma-separated)</Label><Input value={form.labels} onChange={(e) => setForm({ ...form, labels: e.target.value })} placeholder="react, typescript, nextjs" /></FormGroup>
          <FormGroup><Label>Difficulty</Label><Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option value="">None</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></FormGroup>
          <FormGroup><Label>Read Time (mins)</Label><Input type="number" value={form.readTimeMins} onChange={(e) => setForm({ ...form, readTimeMins: e.target.value })} placeholder="5" /></FormGroup>
        </FormRow>
        <FormRow><FormGroup><Label>AI Disclosure</Label><Select value={form.aiDisclosureStatus} onChange={(e) => setForm({ ...form, aiDisclosureStatus: e.target.value })}><option value="">Auto (based on date)</option><option value="none">No AI Involvement</option><option value="llm-reviewed">AI-Reviewed</option><option value="llm-assisted">AI-Assisted</option></Select><FieldHint>Posts before Nov 30, 2022 default to &quot;No AI&quot;. <a href="/ai-disclosure" target="_blank" rel="noopener noreferrer">Learn more</a></FieldHint></FormGroup></FormRow>

        {isCreator && post && (
          <CollaboratorsSection>
            <CollaboratorsHeader>
              <CollaboratorsTitle><Users size={16} /> Collaborators {savingCollaborators && <SavingIndicator>Saving...</SavingIndicator>}</CollaboratorsTitle>
              <CollaboratorsDescription>Collaborators can edit this post. Only you can manage collaborators.</CollaboratorsDescription>
            </CollaboratorsHeader>
            <CollaboratorsList>
              {collaboratorDetails && collaboratorDetails.length > 0 ? collaboratorDetails.map((user) => (
                <CollaboratorChip key={user.id}>
                  {user.avatarUrl ? <CollaboratorAvatar src={user.avatarUrl} alt={user.displayName} /> : <CollaboratorAvatarPlaceholder>{user.displayName.charAt(0).toUpperCase()}</CollaboratorAvatarPlaceholder>}
                  <CollaboratorName>{user.displayName}</CollaboratorName>
                  <RemoveCollaboratorButton onClick={() => handleRemoveCollaborator(user.id)} title="Remove collaborator"><X size={14} /></RemoveCollaboratorButton>
                </CollaboratorChip>
              )) : <NoCollaborators>No collaborators yet</NoCollaborators>}
            </CollaboratorsList>
            <CollaboratorPickerWrapper>
              <CollaboratorSearchInput ref={collaboratorInputRef} value={collaboratorSearch} onChange={(e) => { setCollaboratorSearch(e.target.value); setShowCollaboratorPicker(true); }} onFocus={() => setShowCollaboratorPicker(true)} placeholder="Search users to add..." />
              <SearchIconStyled><Search size={16} /></SearchIconStyled>
              {showCollaboratorPicker && collaboratorSearch.length > 0 && (
                <CollaboratorDropdown>
                  {filteredSearchResults.length > 0 ? filteredSearchResults.map((user) => (
                    <CollaboratorOption key={user.id} onClick={() => handleAddCollaborator(user.id)}>
                      {user.avatarUrl ? <CollaboratorAvatar src={user.avatarUrl} alt={user.displayName} /> : <CollaboratorAvatarPlaceholder>{user.displayName.charAt(0).toUpperCase()}</CollaboratorAvatarPlaceholder>}
                      <CollaboratorOptionInfo><CollaboratorOptionName>{user.displayName}</CollaboratorOptionName>{user.username && <CollaboratorOptionUsername>@{user.username}</CollaboratorOptionUsername>}</CollaboratorOptionInfo>
                      <UserPlus size={16} />
                    </CollaboratorOption>
                  )) : <NoResults>No users found</NoResults>}
                </CollaboratorDropdown>
              )}
            </CollaboratorPickerWrapper>
          </CollaboratorsSection>
        )}

        <FormGroup style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Label>Content (MDX)</Label>
          {contentLoaded ? <MDXEditor initialContent={form.content} onChange={(mdx) => setForm({ ...form, content: mdx })} placeholder="Start writing... Type '/' for commands" /> : <div style={{ padding: "20px", color: "#888" }}>Loading content...</div>}
        </FormGroup>
      </EditorForm>
    </TabPanel>
  );
}

function MigrationTab() {
  const { data: status } = useRQ({ queryKey: ["admin-blog", "migrationStatus"], queryFn: () => getMigrationStatus() });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: _creatorId } = useRQ({ queryKey: ["admin-blog", "creatorId"], queryFn: () => getCreatorId() });
  const [migrating] = useState(false);

  return (
    <TabPanel>
      <SectionTitle>Migration from GitHub</SectionTitle>
      <Text>Migrate your existing blog posts from the GitHub repository to Postgres.</Text>
      {status && <StatsGrid><StatCard><StatValue>{status.postCount}</StatValue><StatLabel>Posts in Postgres</StatLabel></StatCard></StatsGrid>}
      <MigrationActions>
        <ActionButton onClick={() => alert("Migration not available in Postgres mode. Data has already been migrated.")} disabled={migrating}><RefreshCw size={16} /> Run Migration</ActionButton>
        <ActionButton onClick={() => alert("Migration not available in Postgres mode. Use the database directly.")} $danger><Trash2 size={16} /> Clear All Posts</ActionButton>
      </MigrationActions>
      <WarningBox><strong>Note:</strong> Migration actions are disabled in Postgres mode. Data has already been migrated from Convex.</WarningBox>
    </TabPanel>
  );
}

function DiscordTab() {
  return (
    <TabPanel>
      <SectionTitle>Discord Comment Sync</SectionTitle>
      <Text>Comments from your website are automatically synced to Discord article threads.</Text>
      <InfoBox>
        <strong>How it works:</strong>
        <ul>
          <li>When a user comments on a blog post, it&apos;s posted to the article&apos;s Discord thread</li>
          <li>Comments appear with the user&apos;s display name and avatar via webhook</li>
          <li>Configure the webhook URL in each channel&apos;s settings (article, video, news)</li>
          <li>The bot creates threads when publishing, webhooks post comments to those threads</li>
        </ul>
      </InfoBox>
    </TabPanel>
  );
}

// ============================================
// STYLED COMPONENTS
// ============================================
const Container = styled.div`width: 100%; max-width: 900px; margin: 0 auto; padding: 40px 20px;`;
const AdminContainer = styled.div`width: 100%; max-width: 1400px; margin: 0 auto; padding: 20px 0;`;
const Header = styled.div`margin-bottom: 24px; padding: 0 24px;`;
const Title = styled.h1`font-size: 28px; font-weight: 700; color: ${(p) => p.theme.contrast}; margin: 0 0 8px;`;
const Text = styled.p`color: ${(p) => p.theme.textColor}; margin: 0;`;
const TabBar = styled.div`display: flex; gap: 8px; border-bottom: 1px solid ${(p) => p.theme.borderColor || "#333"}; padding: 0 24px 12px; margin-bottom: 24px; flex-wrap: wrap;`;
const Tab = styled.button<{ $active?: boolean }>`display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px; background: ${(p) => (p.$active ? p.theme.contrast : "transparent")}; color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)}; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; &:hover { background: ${(p) => (p.$active ? p.theme.contrast : p.theme.borderColor || "#333")}; }`;
const TabContent = styled.div`width: 100%;`;
const TabPanel = styled.div`display: flex; flex-direction: column; width: 100%;`;
const SectionTitle = styled.h2`font-size: 18px; font-weight: 600; color: ${(p) => p.theme.contrast}; margin: 0 0 16px;`;
const StatsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px;`;
const StatCard = styled.div`background: ${(p) => p.theme.borderColor || "#222"}; border-radius: 12px; padding: 20px; text-align: center;`;
const StatValue = styled.div`font-size: 32px; font-weight: 700; color: ${(p) => p.theme.contrast};`;
const StatLabel = styled.div`font-size: 14px; color: ${(p) => p.theme.textColor}; margin-top: 4px;`;
const PostsHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 24px; flex-wrap: wrap; gap: 12px;`;
const FilterGroup = styled.div`display: flex; gap: 8px;`;
const FilterButton = styled.button<{ $active?: boolean }>`padding: 6px 12px; border: 1px solid ${(p) => (p.$active ? p.theme.contrast : p.theme.borderColor || "#333")}; border-radius: 6px; background: ${(p) => (p.$active ? p.theme.contrast : "transparent")}; color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)}; font-size: 13px; cursor: pointer; transition: all 0.2s; &:hover { border-color: ${(p) => p.theme.contrast}; }`;
const ActionButton = styled.button<{ $secondary?: boolean; $danger?: boolean }>`display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px; background: ${(p) => p.$danger ? "#ef4444" : p.$secondary ? p.theme.borderColor || "#333" : p.theme.contrast}; color: ${(p) => (p.$secondary ? p.theme.contrast : p.theme.background)}; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; &:hover { opacity: 0.9; } &:disabled { opacity: 0.5; cursor: not-allowed; } .spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
const StatusBadge = styled.span<{ $status: string }>`padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; text-transform: uppercase; background: ${(p) => p.$status === "published" ? "#22c55e" : p.$status === "draft" ? "#f59e0b" : "#6b7280"}; color: white;`;
const EditorHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; h2 { margin: 0; color: ${(p) => p.theme.contrast}; }`;
const EditorActions = styled.div`display: flex; gap: 8px;`;
const EditorForm = styled.div`display: flex; flex-direction: column; gap: 16px; flex: 1; min-height: 0; overflow: auto; @media (max-width: 768px) { gap: 12px; }`;
const FormRow = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 6px;`;
const Label = styled.label`font-size: 13px; font-weight: 500; color: ${(p) => p.theme.textColor};`;
const Input = styled.input`padding: 10px 12px; border: 1px solid ${(p) => p.theme.borderColor || "#333"}; border-radius: 8px; background: ${(p) => p.theme.background}; color: ${(p) => p.theme.contrast}; font-size: 14px; &:focus { outline: none; border-color: ${(p) => p.theme.contrast}; }`;
const Select = styled.select`padding: 10px 12px; border: 1px solid ${(p) => p.theme.borderColor || "#333"}; border-radius: 8px; background: ${(p) => p.theme.background}; color: ${(p) => p.theme.contrast}; font-size: 14px; &:focus { outline: none; border-color: ${(p) => p.theme.contrast}; }`;
const FieldHint = styled.p`font-size: 12px; color: ${(p) => p.theme.textColor}; margin: 4px 0 0 0; opacity: 0.7; a { color: ${(p) => p.theme.linkColor || "#7c7ce0"}; text-decoration: none; &:hover { text-decoration: underline; } }`;
const VisibilitySection = styled.div`display: flex; flex-direction: column; gap: 10px; padding: 16px; background: rgba(144, 116, 242, 0.05); border: 1px solid rgba(144, 116, 242, 0.2); border-radius: 12px; margin-bottom: 16px;`;
const VisibilityLabel = styled.label`display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: ${(p) => p.theme.contrast};`;
const VisibilitySelect = styled.select<{ $restricted?: boolean }>`padding: 10px 12px; border: 1px solid ${(p) => (p.$restricted ? "rgba(168, 85, 247, 0.4)" : p.theme.borderColor || "#333")}; border-radius: 8px; background: ${(p) => (p.$restricted ? "rgba(168, 85, 247, 0.1)" : p.theme.background)}; color: ${(p) => p.theme.contrast}; font-size: 14px; &:focus { outline: none; border-color: rgba(144, 116, 242, 0.6); }`;
const VisibilityHint = styled.div`display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(168, 85, 247, 0.9); padding: 8px 12px; background: rgba(168, 85, 247, 0.1); border-radius: 6px; a { color: rgba(168, 85, 247, 1); text-decoration: underline; } svg { flex-shrink: 0; }`;
const LayoutHint = styled.p`font-size: 13px; color: ${(p) => p.theme.textColor}; margin: 0 0 20px; padding: 0 24px;`;
const SavingIndicator = styled.span`font-size: 13px; color: #9074f2; display: flex; align-items: center; gap: 6px; &::before { content: ""; width: 8px; height: 8px; background: #9074f2; border-radius: 50%; animation: pulse 1s ease-in-out infinite; } @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`;
const MigrationActions = styled.div`display: flex; gap: 12px; margin: 20px 0;`;
const WarningBox = styled.div`padding: 16px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; color: #92400e; font-size: 14px;`;
const InfoBox = styled.div`margin-top: 24px; padding: 16px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: ${(p) => p.theme.textColor}; font-size: 14px; strong { color: ${(p) => p.theme.contrast}; } ul { margin: 8px 0 0; padding-left: 20px; } li { margin: 4px 0; }`;
const LoadingContainer = styled.div`display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 16px;`;
const LoadingSpinner = styled.div`width: 32px; height: 32px; border: 3px solid ${(p) => p.theme.borderColor || "#333"}; border-top-color: ${(p) => p.theme.contrast}; border-radius: 50%; animation: spin 1s linear infinite; @keyframes spin { to { transform: rotate(360deg); } }`;
const LoadingText = styled.div`font-size: 14px; color: ${(p) => p.theme.textColor};`;
const AnalyticsHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;`;
const AnalyticsSubTabs = styled.div`display: flex; gap: 4px; flex-wrap: wrap;`;
const SubTab = styled.button<{ $active?: boolean }>`display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 8px; background: ${(p) => (p.$active ? p.theme.contrast : "transparent")}; color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)}; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; &:hover { background: ${(p) => (p.$active ? p.theme.contrast : p.theme.borderColor || "#333")}; }`;
const TimePeriodSelector = styled.div`display: flex; align-items: center; gap: 6px; padding: 4px; background: ${(p) => p.theme.borderColor || "#222"}; border-radius: 8px; color: ${(p) => p.theme.textColor};`;
const PeriodButton = styled.button<{ $active?: boolean }>`padding: 6px 12px; border: none; border-radius: 6px; background: ${(p) => (p.$active ? p.theme.contrast : "transparent")}; color: ${(p) => (p.$active ? p.theme.background : p.theme.textColor)}; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; &:hover { background: ${(p) => (p.$active ? p.theme.contrast : "rgba(255,255,255,0.1)")}; }`;
const MetricsGrid = styled.div`display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); } @media (max-width: 500px) { grid-template-columns: 1fr; }`;
const MetricCard = styled.div<{ $color?: string }>`background: ${(p) => p.theme.borderColor || "#222"}; border-radius: 12px; padding: 20px; display: flex; align-items: flex-start; gap: 16px; border-left: 4px solid ${(p) => p.$color || p.theme.contrast};`;
const MetricIcon = styled.div`color: ${(p) => p.theme.textColor}; opacity: 0.7;`;
const MetricContent = styled.div`flex: 1;`;
const MetricValue = styled.div`font-size: 28px; font-weight: 700; color: ${(p) => p.theme.contrast}; line-height: 1.1;`;
const MetricLabel = styled.div`font-size: 13px; color: ${(p) => p.theme.textColor}; margin-top: 4px;`;
const MetricChange = styled.div<{ $positive?: boolean }>`display: inline-flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 600; color: ${(p) => (p.$positive ? "#10b981" : "#ef4444")}; margin-top: 6px;`;
const MetricSubtext = styled.div`font-size: 12px; color: ${(p) => p.theme.textColor}; opacity: 0.7; margin-top: 4px;`;
const ChartSection = styled.div`background: ${(p) => p.theme.borderColor || "#222"}; border-radius: 12px; padding: 20px; margin-bottom: 24px;`;
const ChartHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;`;
const ChartTitle = styled.h3`font-size: 16px; font-weight: 600; color: ${(p) => p.theme.contrast}; margin: 0;`;
const ChartContainer = styled.div`height: 300px; width: 100%;`;
const LargeChartContainer = styled.div`height: 400px; width: 100%;`;
const NoDataMessage = styled.div`display: flex; align-items: center; justify-content: center; height: 100%; color: ${(p) => p.theme.textColor}; opacity: 0.6; font-size: 14px;`;
const TableContainer = styled.div`overflow-x: auto; background: ${(p) => p.theme.borderColor || "#222"}; border-radius: 12px;`;
const AnalyticsTable = styled.table`width: 100%; border-collapse: collapse; font-size: 13px;`;
const TableHeader = styled.th`text-align: left; padding: 14px 16px; font-weight: 600; color: ${(p) => p.theme.textColor}; border-bottom: 1px solid ${(p) => p.theme.background};`;
const SortableHeader = styled(TableHeader)<{ $active?: boolean }>`cursor: pointer; user-select: none; display: flex; align-items: center; gap: 4px; color: ${(p) => (p.$active ? p.theme.contrast : p.theme.textColor)}; &:hover { color: ${(p) => p.theme.contrast}; }`;
const TableRow = styled.tr`&:hover { background: rgba(255, 255, 255, 0.02); }`;
const TableCell = styled.td`padding: 12px 16px; border-bottom: 1px solid ${(p) => p.theme.background}; color: ${(p) => p.theme.contrast}; vertical-align: middle;`;
const PostCellContent = styled.div`display: flex; align-items: center; gap: 10px;`;
const PostCellIcon = styled.div`color: ${(p) => p.theme.textColor}; opacity: 0.6;`;
const PostCellTitle = styled.div`font-weight: 500; color: ${(p) => p.theme.contrast}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;`;
const PostCellSlug = styled.div`font-size: 11px; color: ${(p) => p.theme.textColor}; opacity: 0.6;`;
const CellValue = styled.div`font-weight: 600; color: ${(p) => p.theme.contrast};`;
const CellSubvalue = styled.div`font-size: 11px; color: ${(p) => p.theme.textColor}; opacity: 0.6;`;
const EmptyPostsState = styled.div`padding: 60px 24px; text-align: center; color: ${(p) => p.theme.textColor}; h2 { margin: 0 0 8px; font-size: 24px; color: ${(p) => p.theme.contrast}; } p { margin: 0; font-size: 16px; opacity: 0.7; }`;
const AdminPostsList = styled.div`display: flex; flex-direction: column; gap: 12px; padding: 0 24px;`;
const AdminPostCard = styled.div`display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: ${(p) => p.theme.postBackground}; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; transition: border-color 0.2s ease; &:hover { border-color: rgba(144, 116, 242, 0.4); }`;
const AdminPostCardInner = styled.a`display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; text-decoration: none; color: inherit;`;
const AdminPostImage = styled.div`position: relative; width: 120px; height: 68px; flex-shrink: 0; border-radius: 8px; overflow: hidden; background: rgba(255, 255, 255, 0.05); img { width: 100%; height: 100%; object-fit: cover; }`;
const AdminPostImagePlaceholder = styled.div`width: 120px; height: 68px; flex-shrink: 0; border-radius: 8px; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.3);`;
const VideoIndicator = styled.div`position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 32px; height: 32px; background: rgba(0, 0, 0, 0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;`;
const AdminPostInfo = styled.div`flex: 1; min-width: 0;`;
const AdminPostTitle = styled.h3`margin: 0 0 6px; font-size: 16px; font-weight: 600; color: ${(p) => p.theme.contrast}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const AdminPostMeta = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;`;
const AdminPostDate = styled.span`font-size: 12px; color: ${(p) => p.theme.textColor}; opacity: 0.6;`;
const DifficultyPill = styled.span<{ $difficulty: string }>`font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px; text-transform: lowercase; background: ${(p) => p.$difficulty === "beginner" ? "rgba(34,197,94,0.12)" : p.$difficulty === "intermediate" ? "rgba(251,191,36,0.12)" : "rgba(239,68,68,0.12)"}; border: 1px solid ${(p) => p.$difficulty === "beginner" ? "rgba(34,197,94,0.3)" : p.$difficulty === "intermediate" ? "rgba(251,191,36,0.3)" : "rgba(239,68,68,0.3)"}; color: ${(p) => p.$difficulty === "beginner" ? "#4ade80" : p.$difficulty === "intermediate" ? "#fbbf24" : "#f87171"};`;
const LabelPill = styled.span`font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px; background: rgba(144, 116, 242, 0.15); border: 1px solid rgba(144, 116, 242, 0.3); color: #a5a3f5;`;
const TypePill = styled.span<{ $type: string }>`font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px; text-transform: capitalize; background: ${(p) => p.$type === "video" ? "rgba(239,68,68,0.12)" : p.$type === "news" ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.08)"}; border: 1px solid ${(p) => p.$type === "video" ? "rgba(239,68,68,0.3)" : p.$type === "news" ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.15)"}; color: ${(p) => p.$type === "video" ? "#f87171" : p.$type === "news" ? "#60a5fa" : "rgba(255,255,255,0.7)"};`;
const StatusPill = styled.span<{ $status?: string }>`font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px; text-transform: capitalize; background: ${(p) => p.$status === "published" ? "rgba(34,197,94,0.12)" : p.$status === "archived" ? "rgba(107,114,128,0.12)" : "rgba(251,191,36,0.12)"}; border: 1px solid ${(p) => p.$status === "published" ? "rgba(34,197,94,0.3)" : p.$status === "archived" ? "rgba(107,114,128,0.3)" : "rgba(251,191,36,0.3)"}; color: ${(p) => p.$status === "published" ? "#4ade80" : p.$status === "archived" ? "#9ca3af" : "#fbbf24"};`;
const AdminPostActions = styled.div`display: flex; align-items: center; gap: 12px; flex-shrink: 0;`;
const SizeButtons = styled.div`display: flex; gap: 4px;`;
const SizeBtn = styled.button<{ $active?: boolean }>`width: 28px; height: 28px; border-radius: 6px; border: 1px solid ${(p) => p.$active ? "rgba(144,116,242,0.6)" : "rgba(255,255,255,0.1)"}; background: ${(p) => p.$active ? "rgba(144,116,242,0.3)" : "rgba(255,255,255,0.05)"}; color: ${(p) => p.$active ? "#fff" : p.theme.textColor}; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; &:hover { background: rgba(144,116,242,0.2); border-color: rgba(144,116,242,0.4); }`;
const ActionBtns = styled.div`display: flex; gap: 4px;`;
const ActionBtn = styled.button<{ $danger?: boolean; $success?: boolean }>`width: 28px; height: 28px; border-radius: 6px; border: 1px solid ${(p) => p.$danger ? "rgba(239,68,68,0.3)" : p.$success ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}; background: ${(p) => p.$danger ? "rgba(239,68,68,0.1)" : p.$success ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)"}; color: ${(p) => p.$danger ? "#f87171" : p.$success ? "#4ade80" : p.theme.textColor}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; &:hover { background: ${(p) => p.$danger ? "rgba(239,68,68,0.2)" : p.$success ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.1)"}; }`;
const CollaboratorsSection = styled.div`margin: 24px 0; padding: 20px; background: rgba(144, 116, 242, 0.05); border: 1px solid rgba(144, 116, 242, 0.2); border-radius: 12px;`;
const CollaboratorsHeader = styled.div`margin-bottom: 16px;`;
const CollaboratorsTitle = styled.h3`display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-size: 15px; font-weight: 600; color: ${(p) => p.theme.contrast};`;
const CollaboratorsDescription = styled.p`margin: 0; font-size: 13px; color: ${(p) => p.theme.textColor}; opacity: 0.7;`;
const CollaboratorsList = styled.div`display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;`;
const CollaboratorChip = styled.div`display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px;`;
const CollaboratorAvatar = styled.img`width: 24px; height: 24px; border-radius: 50%; object-fit: cover;`;
const CollaboratorAvatarPlaceholder = styled.div`width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: white;`;
const CollaboratorName = styled.span`font-size: 13px; font-weight: 500; color: ${(p) => p.theme.contrast};`;
const RemoveCollaboratorButton = styled.button`display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border: none; background: rgba(255, 100, 100, 0.15); border-radius: 50%; color: rgba(255, 100, 100, 0.8); cursor: pointer; transition: all 0.15s ease; &:hover { background: rgba(255, 100, 100, 0.3); color: #ff6464; }`;
const NoCollaborators = styled.span`font-size: 13px; color: ${(p) => p.theme.textColor}; opacity: 0.5; font-style: italic;`;
const CollaboratorPickerWrapper = styled.div`position: relative;`;
const CollaboratorSearchInput = styled.input`width: 100%; padding: 10px 12px 10px 36px; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; background: rgba(0, 0, 0, 0.2); color: ${(p) => p.theme.contrast}; font-size: 14px; &:focus { outline: none; border-color: rgba(144, 116, 242, 0.5); } &::placeholder { color: ${(p) => p.theme.textColor}; opacity: 0.5; }`;
const SearchIconStyled = styled.div`position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: ${(p) => p.theme.textColor}; opacity: 0.5;`;
const CollaboratorDropdown = styled.div`position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; max-height: 240px; overflow-y: auto; background: ${(p) => p.theme.background}; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); z-index: 100;`;
const CollaboratorOption = styled.button`display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border: none; background: transparent; color: ${(p) => p.theme.contrast}; font-size: 14px; cursor: pointer; text-align: left; transition: background 0.15s ease; &:hover { background: rgba(144, 116, 242, 0.15); } svg { margin-left: auto; color: #a5a3f5; opacity: 0; transition: opacity 0.15s ease; } &:hover svg { opacity: 1; }`;
const CollaboratorOptionInfo = styled.div`display: flex; flex-direction: column; gap: 2px;`;
const CollaboratorOptionName = styled.span`font-weight: 500;`;
const CollaboratorOptionUsername = styled.span`font-size: 12px; color: ${(p) => p.theme.textColor}; opacity: 0.6;`;
const NoResults = styled.div`padding: 16px; text-align: center; font-size: 13px; color: ${(p) => p.theme.textColor}; opacity: 0.5;`;
