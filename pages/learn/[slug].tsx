import {
  faDev,
  faHashnode,
  faMedium,
} from "@fortawesome/free-brands-svg-icons";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { Share2, FileText } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Head from "next/head";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { m, useScroll, useTransform, useSpring } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { ReactionBar } from "../../components/learn/ReactionBar";
import { CommentSection } from "../../components/learn/CommentSection";
import { BentoCard } from "../../components/learn/BentoCard";
import { TableOfContents, type TOCItem } from "../../components/learn/TableOfContents";
import { FloatingToolbar, ReportModal } from "../../components/learn/toolbar";
import { ShareModal, CreditsModal } from "../../components/learn/modals";
import { useTimeTracking } from "../../components/learn/useTimeTracking";
import { useArticleWatchTime } from "../../components/learn/useArticleWatchTime";
import {
  SelectionToolbar,
  SelectionCommentInput,
  HighlightOverlay,
  HighlightCount,
  HighlightModal,
  InlineCommentBubble,
  useTextSelection,
  TextAnchor,
} from "../../components/learn/highlights";
import { CircleIndicator } from "../../components/blog/circle-indicator";
import { UserPopoutProvider, UserPopout, UserPopoutTrigger } from "../../components/lounge/user-popout";
import CodeBlock from "../../components/blog/codeblock";
import { DiscordInviteLink, isDiscordInvite } from "../../components/blog/discord-invite-link";
import { Label, Labels } from "../../components/blog/labels";
import { PostHeader } from "../../components/blog/post-header";
import { PostHeroImg } from "../../components/blog/post-hero-img";
import { PostImg } from "../../components/blog/post-img";
import { PostSubheader } from "../../components/blog/post-sub-header";
import { Container } from "../../components/container";
import { IconLink } from "../../components/generics";
import { Avatar } from "../../components/generics/avatar";
import { BlogView } from "../../components/layout/blog";
import { SimpleNavbar } from "../../components/navbar/simple";
import type { DiscordWidget } from "../../types/discord";
import { fetchDiscordWidget } from "../../utils/discord-widget";
import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../convex/_generated/dataModel";
import { isLearnTitleAnimationEnabled } from "../../lib/flags";

// Context for Discord widget data
const DiscordWidgetContext = createContext<DiscordWidget | null>(null);

// Component that uses the context
function DiscordLink({ href }: { href: string }) {
  const widget = useContext(DiscordWidgetContext);
  return <DiscordInviteLink href={href} widget={widget} />;
}

interface AuthorInfo {
  _id: Id<"users">;
  displayName: string;
  username?: string;
  avatarUrl?: string;
}

interface PostData {
  _id: Id<"blogPosts">;
  slug: string;
  title: string;
  description: string;
  content: string;
  contentType: "article" | "video" | "news";
  coverImage?: string;
  coverAuthor?: string;
  coverAuthorUrl?: string;
  coverGradientIntensity?: number;
  youtubeId?: string;
  labels: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  readTimeMins?: number;
  publishedAt?: number;
  mediumUrl?: string;
  hashnodeUrl?: string;
  devToUrl?: string;
  author?: AuthorInfo | null;
  collaborators?: AuthorInfo[];
}

type LearnPostProps = {
  post: PostData | null;
  mdxSource: MDXRemoteSerializeResult | null;
  discordWidget: DiscordWidget | null;
  enableTitleAnimation: boolean;
  hasDuplicateTitle: boolean;
  hasDuplicateDescription: boolean;
};

export default function LearnPost({ post, mdxSource, discordWidget, enableTitleAnimation, hasDuplicateTitle, hasDuplicateDescription }: LearnPostProps) {
  const [, setCompleted] = useState(false);
  const recordView = useMutation(api.blogViews.recordView);
  const grantPostViewXp = useMutation(api.experience.grantPostViewXp);

  // Track time on site for XP
  useTimeTracking();

  // Track article watch time for recommendations
  useArticleWatchTime({ postId: post?._id, enabled: !!post?._id });

  // Get similar articles via vector search (with session-based exclusion to avoid loops)
  const [similarSlugs, setSimilarSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!post || post.contentType !== "article") return;

    // Track viewed articles in sessionStorage to break recommendation loops
    let viewed: string[] = [];
    try {
      const VIEWED_KEY = "learn_viewed_articles";
      const viewedRaw = sessionStorage.getItem(VIEWED_KEY);
      viewed = viewedRaw ? JSON.parse(viewedRaw) : [];

      // Add current article to viewed list (keep last 20 to avoid unbounded growth)
      if (!viewed.includes(post.slug)) {
        viewed.push(post.slug);
        if (viewed.length > 20) viewed.shift();
        sessionStorage.setItem(VIEWED_KEY, JSON.stringify(viewed));
      }
    } catch {
      // sessionStorage not available (SSR, incognito, etc.)
      viewed = [post.slug];
    }

    fetch("/api/recommendations/similar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: post.title,
        description: post.description,
        labels: post.labels,
        currentSlug: post.slug,
        excludeSlugs: viewed, // Exclude previously viewed articles
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.similar) {
          setSimilarSlugs(data.similar.map((s: { id: string }) => s.id));
        }
      })
      .catch(() => {});
  }, [post?.slug, post?.title, post?.description, post?.labels, post?.contentType]);

  const similarArticles = useQuery(
    api.blogPosts.getPostsBySlugs,
    similarSlugs.length > 0 ? { slugs: similarSlugs } : "skip"
  );

  // Record view and grant XP when post loads
  useEffect(() => {
    if (post?._id) {
      recordView({ postId: post._id });
      grantPostViewXp({ postId: post._id });
    }
  }, [post?._id, recordView, grantPostViewXp]);

  // Not found
  if (!post) {
    return (
      <BlogView>
        <SimpleNavbar backRoute="/learn" />
        <NotFoundContainer>
          <h1>Post not found</h1>
          <p>The post you're looking for doesn't exist or has been removed.</p>
        </NotFoundContainer>
      </BlogView>
    );
  }

  return (
    <UserPopoutProvider>
      <DiscordWidgetContext.Provider value={discordWidget}>
        <CircleIndicator onComplete={() => setCompleted(true)} />
        <PostBody post={post} mdxSource={mdxSource} similarArticles={similarArticles} enableTitleAnimation={enableTitleAnimation} hasDuplicateTitle={hasDuplicateTitle} hasDuplicateDescription={hasDuplicateDescription} />
        {/* UserPopout rendered at root level for portal positioning */}
        <UserPopout />
      </DiscordWidgetContext.Provider>
    </UserPopoutProvider>
  );
}

interface SimilarArticle {
  _id: Id<"blogPosts">;
  slug: string;
  title: string;
  description: string;
  contentType: string;
  coverImage?: string;
  labels: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  readTimeMins?: number;
  viewCount: number;
  publishedAt?: number;
  author?: { displayName: string; avatarUrl?: string } | null;
}

function PostBody({ post, mdxSource, similarArticles, enableTitleAnimation, hasDuplicateTitle, hasDuplicateDescription }: { post: PostData; mdxSource: MDXRemoteSerializeResult | null; similarArticles?: SimilarArticle[]; enableTitleAnimation: boolean; hasDuplicateTitle: boolean; hasDuplicateDescription: boolean }) {
  const location = `https://nev.so/learn/${post.slug}`;
  const ogImage = post.coverImage || `https://nev.so/api/og?title=${encodeURIComponent(post.title)}`;
  const creationDate = post.publishedAt ? new Date(post.publishedAt) : new Date();

  // Auth state
  const { isSignedIn, user } = useUser();

  // Refs for measuring positions
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const thanksSectionRef = useRef<HTMLDivElement>(null);

  // Highlights state
  const [highlightModalOpen, setHighlightModalOpen] = useState(false);
  const [newHighlightIds, setNewHighlightIds] = useState<Set<string>>(new Set());
  const [isHighlighting, setIsHighlighting] = useState(false);

  // Toolbar state
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const [tocHeadings, setTocHeadings] = useState<TOCItem[]>([]);
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Comment input state
  const [pendingComment, setPendingComment] = useState<{
    anchor: TextAnchor;
    position: { top: number; left: number };
    selectedText: string;
  } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Get current Convex user for highlight ownership checks
  const convexUser = useQuery(api.users.getMe);

  // Highlight queries
  const highlights = useQuery(api.contentHighlights.getForPost, { postId: post._id });
  const highlightCounts = useQuery(api.contentHighlights.getCounts, { postId: post._id });
  const highlightsWithDetails = useQuery(api.contentHighlights.getWithDetails, { postId: post._id });

  // Reactions query - for showing in modal
  const highlightReactions = useQuery(api.contentReactions.getForPost, { postId: post._id });

  // Comment counts for highlights
  const highlightCommentCounts = useQuery(api.contentComments.getCountsForPost, { postId: post._id });

  // State for viewing comments on a highlight
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [activeHighlightElement, setActiveHighlightElement] = useState<Element | null>(null);
  const [activeHighlightRect, setActiveHighlightRect] = useState<DOMRect | null>(null);

  // Keep bubble position synced with element during scroll
  useEffect(() => {
    if (!activeHighlightElement) {
      setActiveHighlightRect(null);
      return;
    }

    // Initial position
    setActiveHighlightRect(activeHighlightElement.getBoundingClientRect());

    // Update on scroll/resize using passive listener + RAF
    let rafId: number;
    const updatePosition = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (activeHighlightElement) {
          setActiveHighlightRect(activeHighlightElement.getBoundingClientRect());
        }
      });
    };

    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition, { passive: true });

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      cancelAnimationFrame(rafId);
    };
  }, [activeHighlightElement]);

  // Query comments for active highlight
  const activeHighlightComments = useQuery(
    api.contentComments.getForHighlight,
    activeHighlightId ? { highlightId: activeHighlightId as Id<"contentHighlights"> } : "skip"
  );

  // Get highlighted text for the active highlight (with user details)
  const activeHighlight = highlightsWithDetails?.highlights?.find(h => h._id.toString() === activeHighlightId);

  // Highlight mutations
  const createHighlight = useMutation(api.contentHighlights.create);
  const removeHighlight = useMutation(api.contentHighlights.remove);
  const createComment = useMutation(api.contentComments.create);
  const reactToHighlight = useMutation(api.contentReactions.react);

  // Text selection hook
  const selection = useTextSelection({
    containerRef: contentRef,
    debounceMs: 150,
  });

  // Handle creating a highlight
  const handleHighlight = useCallback(async (anchor: TextAnchor) => {
    if (!isSignedIn) return;
    setIsHighlighting(true);
    try {
      const highlightId = await createHighlight({
        postId: post._id,
        highlightedText: anchor.highlightedText,
        prefix: anchor.prefix,
        suffix: anchor.suffix,
      });
      // Mark as new for animation
      setNewHighlightIds((prev) => new Set([...prev, highlightId]));
      // Clear after animation
      setTimeout(() => {
        setNewHighlightIds((prev) => {
          const next = new Set(prev);
          next.delete(highlightId);
          return next;
        });
      }, 1000);
      selection.clearSelection();
    } catch (error) {
      console.error("Failed to create highlight:", error);
    } finally {
      setIsHighlighting(false);
    }
  }, [isSignedIn, createHighlight, post._id, selection]);

  // Handle comment button click - shows comment input
  const handleComment = useCallback((anchor: TextAnchor) => {
    if (!isSignedIn) return;

    // Use selection.rect if available, otherwise calculate from anchor text position
    const scrollY = window.scrollY;
    let position: { top: number; left: number };

    if (selection.rect) {
      position = {
        top: selection.rect.bottom + scrollY + 12,
        left: selection.rect.left + selection.rect.width / 2,
      };
    } else {
      // Fallback: center of viewport
      position = {
        top: scrollY + window.innerHeight / 3,
        left: window.innerWidth / 2,
      };
    }

    setPendingComment({
      anchor,
      position,
      selectedText: anchor.highlightedText,
    });

    // Clear the text selection so toolbar hides
    selection.clearSelection();
  }, [isSignedIn, selection]);

  // Handle comment submission - creates highlight + comment
  const handleCommentSubmit = useCallback(async (content: string) => {
    if (!pendingComment || !isSignedIn) return;

    setIsSubmittingComment(true);
    try {
      // First create the highlight
      const highlightId = await createHighlight({
        postId: post._id,
        highlightedText: pendingComment.anchor.highlightedText,
        prefix: pendingComment.anchor.prefix,
        suffix: pendingComment.anchor.suffix,
      });

      // Then create the comment on that highlight
      await createComment({
        highlightId,
        content,
      });

      // Mark as new for animation
      setNewHighlightIds((prev) => new Set([...prev, highlightId]));
      setTimeout(() => {
        setNewHighlightIds((prev) => {
          const next = new Set(prev);
          next.delete(highlightId);
          return next;
        });
      }, 1000);

      // Close the comment input
      setPendingComment(null);
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  }, [pendingComment, isSignedIn, createHighlight, createComment, post._id]);

  // Handle canceling comment
  const handleCommentCancel = useCallback(() => {
    setPendingComment(null);
  }, []);

  // Handle deleting a highlight
  const handleDeleteHighlight = useCallback(async (highlightId: string) => {
    if (!isSignedIn) return;
    await removeHighlight({ highlightId: highlightId as Id<"contentHighlights"> });
  }, [isSignedIn, removeHighlight]);

  // Handle reaction on highlight - creates reaction-only anchor then adds reaction
  const handleReact = useCallback(async (anchor: TextAnchor, type: string) => {
    if (!isSignedIn) return;

    try {
      // Create a reaction-only anchor (no visible highlight mark)
      const highlightId = await createHighlight({
        postId: post._id,
        highlightedText: anchor.highlightedText,
        prefix: anchor.prefix,
        suffix: anchor.suffix,
        isReactionOnly: true,
      });

      // Then add the reaction
      await reactToHighlight({
        highlightId,
        type: type as "fire" | "heart" | "plus1" | "eyes" | "question",
      });

      selection.clearSelection();
    } catch (error) {
      console.error("Failed to create reaction:", error);
    }
  }, [isSignedIn, createHighlight, reactToHighlight, post._id, selection]);

  // Scroll to highlight - find the text in content and scroll to it
  const scrollToHighlight = useCallback((highlightId: string) => {
    // Small delay to allow modal to close and body overflow to reset
    setTimeout(() => {
      // First try to find the highlight mark overlay
      const mark = document.querySelector(`[data-highlight-id="${highlightId}"]`);
      if (mark) {
        // Get the mark's position relative to the viewport
        const markRect = mark.getBoundingClientRect();
        const scrollTarget = window.scrollY + markRect.top - window.innerHeight / 2;

        // Scroll to center the highlight in the viewport
        window.scrollTo({
          top: Math.max(0, scrollTarget),
          behavior: "smooth"
        });

        // Flash the highlight to make it more visible
        mark.classList.add("highlight-flash");
        setTimeout(() => mark.classList.remove("highlight-flash"), 2000);
        return;
      }

      // Fallback: find by searching in the content using the highlight data
      const highlight = highlights?.find(h => h._id.toString() === highlightId);
      if (highlight && contentRef.current) {
        const container = contentRef.current;
        const fullText = container.textContent || "";
        const index = fullText.indexOf(highlight.highlightedText);

        if (index !== -1) {
          // Find the text node containing this text
          const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
          let currentPos = 0;
          let node: Text | null;

          while ((node = walker.nextNode() as Text | null)) {
            const nodeLength = node.textContent?.length || 0;
            if (currentPos + nodeLength > index) {
              // Found the node, scroll to its parent element
              const parentEl = node.parentElement;
              if (parentEl) {
                parentEl.scrollIntoView({ behavior: "smooth", block: "center" });
              }
              break;
            }
            currentPos += nodeLength;
          }
        }
      }
    }, 150);
  }, [highlights]);

  // Handle clicking on a highlight to view/add comments
  const handleHighlightClick = useCallback((highlightId: string) => {
    // Find the highlight element to position the bubble
    const marks = document.querySelectorAll(`[data-highlight-ids*="${highlightId}"]`);
    if (marks.length > 0) {
      setActiveHighlightId(highlightId);
      setActiveHighlightElement(marks[0]); // Store element, rect is computed by scroll effect
    } else {
      // Fallback if no mark found
      setActiveHighlightId(highlightId);
      setActiveHighlightElement(null);
    }
  }, []);

  // Handle submitting a comment on an existing highlight
  const handleInlineCommentSubmit = useCallback(async (content: string) => {
    if (!activeHighlightId || !isSignedIn) return;

    try {
      await createComment({
        highlightId: activeHighlightId as Id<"contentHighlights">,
        content,
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert(`Failed to add comment: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [activeHighlightId, isSignedIn, createComment]);

  // Close inline comment bubble
  const handleCloseInlineComment = useCallback(() => {
    setActiveHighlightId(null);
    setActiveHighlightElement(null);
  }, []);

  // Track scroll and create smooth spring-based progress
  const { scrollY } = useScroll();

  // Calculate transition trigger point (when hero is ~80% scrolled past)
  const [triggerPoint, setTriggerPoint] = useState(300);
  const [transitionRange, setTransitionRange] = useState(150);

  useEffect(() => {
    // Skip measurements if animation is disabled
    if (!enableTitleAnimation) return;

    const updateMeasurements = () => {
      if (heroContainerRef.current) {
        const heroRect = heroContainerRef.current.getBoundingClientRect();
        const heroBottom = heroRect.bottom + window.scrollY;
        const isMobile = window.innerWidth < 768;

        // On mobile or small viewports, require more scroll before fading
        // This prevents the title from being in a half-faded state when close to top
        const viewportThreshold = isMobile ? 0.35 : 0.5;
        const calculatedTrigger = heroBottom - window.innerHeight * viewportThreshold;

        // Ensure minimum trigger point so we don't fade too early when hero is near viewport top
        const minTrigger = isMobile ? 150 : 100;
        setTriggerPoint(Math.max(calculatedTrigger, minTrigger));

        // Shorter transition range for more decisive fade (less time in half-state)
        setTransitionRange(isMobile ? 40 : 50);
      }
    };

    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);
    const timeout = setTimeout(updateMeasurements, 100);
    return () => {
      window.removeEventListener('resize', updateMeasurements);
      clearTimeout(timeout);
    };
  }, [enableTitleAnimation]);

  // Smooth progress from 0 to 1 based on scroll
  const rawProgress = useTransform(
    scrollY,
    [triggerPoint, triggerPoint + transitionRange],
    [0, 1]
  );

  // Apply spring physics for iOS-like smoothness
  const progress = useSpring(rawProgress, {
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  });

  // Opacity transitions - hero fades out, content fades in
  // When animation is disabled, hero stays visible (1) and content title is hidden (0)
  const heroTitleOpacityAnimated = useTransform(progress, [0, 0.25], [1, 0]);
  const contentTitleOpacityAnimated = useTransform(progress, [0.15, 0.35], [0, 1]);
  const heroTitleOpacity = enableTitleAnimation ? heroTitleOpacityAnimated : 1;
  const contentTitleOpacity = enableTitleAnimation ? contentTitleOpacityAnimated : 0;

  // Scale for a subtle zoom effect
  // When animation is disabled, use static scale of 1
  const heroScaleAnimated = useTransform(progress, [0, 1], [1, 0.95]);
  const contentScaleAnimated = useTransform(progress, [0, 1], [1.02, 1]);
  const heroScale = enableTitleAnimation ? heroScaleAnimated : 1;
  const contentScale = enableTitleAnimation ? contentScaleAnimated : 1;

  // Hero extends down to fill gap at top, shrinks as you scroll
  // This uses direct scroll position, not the title fade progress
  // On mobile, use more padding to fill the gap between navbar and content
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const rawHeroExtraPadding = useTransform(scrollY, [0, 200], [isMobile ? 100 : 70, 24]);
  const heroExtraPaddingAnimated = useSpring(rawHeroExtraPadding, { stiffness: 300, damping: 30 });
  // Content pulls up to meet the hero (reduces visual gap)
  const rawContentPullUp = useTransform(scrollY, [0, 200], [-50, 0]);
  const contentPullUpAnimated = useSpring(rawContentPullUp, { stiffness: 300, damping: 30 });

  // When animation is disabled, use static values
  const heroExtraPadding = enableTitleAnimation ? heroExtraPaddingAnimated : (isMobile ? 100 : 70);
  const contentPullUp = enableTitleAnimation ? contentPullUpAnimated : 0;

  return (
    <BlogView>
      <BlogStyle />
      <ReadingFocusOverlay />
      <SimpleNavbar backRoute="/learn" />

      {/* Table of Contents - only for articles */}
      {post.contentType === "article" && (
        <>
          <TableOfContents
            heroRef={heroContainerRef}
            thanksSectionRef={thanksSectionRef}
            contentRef={contentRef}
            isCollapsed={tocCollapsed}
            onCollapseChange={setTocCollapsed}
            onHeadingsChange={setTocHeadings}
            onActiveHeadingChange={setActiveHeading}
          />
          <FloatingToolbar
            postId={post._id}
            postSlug={post.slug}
            postTitle={post.title}
            headings={tocHeadings}
            activeHeading={activeHeading}
            highlightCount={highlightCounts?.total || 0}
            tocCollapsed={tocCollapsed}
            onTocCollapseChange={setTocCollapsed}
            onOpenHighlights={() => setHighlightModalOpen(true)}
            heroRef={heroContainerRef}
            thanksSectionRef={thanksSectionRef}
            commentSectionRef={commentSectionRef}
          />
        </>
      )}

      <PostHeroImg
        coverAuthor={post.coverAuthor}
        coverAuthorUrl={post.coverAuthorUrl}
        src={post.coverImage || ""}
        gradientIntensity={post.coverGradientIntensity}
        style={{ paddingBottom: heroExtraPadding }}
      >
        <PostHeader ref={heroContainerRef}>
          <PostSubheader>
            <p>
              Published on{" "}
              {creationDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}{" "}
              by{" "}
              <AuthorList>
                {post.author?._id ? (
                  <AuthorTrigger userId={post.author._id}>
                    {post.author.avatarUrl ? (
                      <AuthorAvatarInline src={post.author.avatarUrl} alt={post.author.displayName} />
                    ) : (
                      <Avatar width="18" height="18" />
                    )}
                    <strong>{post.author.displayName}</strong>
                  </AuthorTrigger>
                ) : (
                  <AuthorChip>
                    <Avatar width="18" height="18" />
                    <strong>Nevulo</strong>
                  </AuthorChip>
                )}
                {post.collaborators && post.collaborators.length > 0 && (
                  <>
                    {post.collaborators.map((collaborator, index) => (
                      <span key={collaborator._id}>
                        <AuthorSeparator>
                          {index === post.collaborators!.length - 1 ? " & " : ", "}
                        </AuthorSeparator>
                        <AuthorTrigger userId={collaborator._id}>
                          {collaborator.avatarUrl ? (
                            <AuthorAvatarInline src={collaborator.avatarUrl} alt={collaborator.displayName} />
                          ) : (
                            <Avatar width="18" height="18" />
                          )}
                          <strong>{collaborator.displayName}</strong>
                        </AuthorTrigger>
                      </span>
                    ))}
                  </>
                )}
              </AuthorList>
            </p>
          </PostSubheader>

          {/* Hero Title - fades based on scroll if there's duplicate content */}
          <HeroTitleWrapper
            style={{
              opacity: hasDuplicateTitle ? heroTitleOpacity : 1,
              scale: hasDuplicateTitle ? heroScale : 1,
            }}
          >
            <h1>{post.title}</h1>
          </HeroTitleWrapper>
          {/* Hero Description - only fades if description also matches */}
          <HeroDescriptionWrapper
            style={{
              opacity: hasDuplicateDescription ? heroTitleOpacity : 1,
            }}
          >
            <h3>{post.description}</h3>
          </HeroDescriptionWrapper>

          {post.labels?.length ? (
            <Labels>
              {post.labels
                .map((labelText) => labelText.replace(/-/g, " "))
                .slice(0, 3)
                .map((label) => (
                  <Label key={label}>{label}</Label>
                ))}
            </Labels>
          ) : null}

          

          {/* Reactions and Highlights */}
          <HeroActionsRow>
            <ReactionBar postId={post._id} variant="hero" />
            {highlightCounts && highlightCounts.total > 0 && (
              <HighlightCount
                count={highlightCounts.total}
                uniqueUsers={highlightCounts.uniqueUsers}
                onClick={() => setHighlightModalOpen(true)}
              />
            )}
          </HeroActionsRow>

          <IconContainer direction="row">
            <HeroActionButton
              onClick={() => setShareModalOpen(true)}
              title="Share this article"
            >
              <Share2 />
            </HeroActionButton>
            <HeroActionButton
              onClick={() => setCreditsModalOpen(true)}
              title="View credits"
            >
              <FileText />
            </HeroActionButton>
            {post.mediumUrl && (
              <IconLink
                icon={faMedium}
                target="_blank"
                href={post.mediumUrl}
                width="24"
                height="24"
              />
            )}
            {post.hashnodeUrl && (
              <IconLink
                icon={faHashnode}
                target="_blank"
                href={post.hashnodeUrl}
                width="24"
                height="24"
              />
            )}
            {post.devToUrl && (
              <IconLink
                icon={faDev}
                target="_blank"
                href={post.devToUrl}
                width="24"
                height="24"
              />
            )}
          </IconContainer>
        </PostHeader>
      </PostHeroImg>

      {/* Video embed for video posts */}
      {post.contentType === "video" && post.youtubeId && (
        <VideoContainer>
          <VideoWrapper>
            <iframe
              src={`https://www.youtube.com/embed/${post.youtubeId}`}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </VideoWrapper>
        </VideoContainer>
      )}

      <PostContainer style={{ marginTop: contentPullUp }}>
        {/* Content title - fades in as hero title fades out */}
        {hasDuplicateTitle && enableTitleAnimation && (
          <ContentTitleWrapper
            style={{
              opacity: contentTitleOpacity,
              scale: contentScale,
            }}
          >
            <ContentTitle>{post.title}</ContentTitle>
            {/* Only show description here if it also matches */}
            {hasDuplicateDescription && (
              <ContentDescription>{post.description}</ContentDescription>
            )}
          </ContentTitleWrapper>
        )}

        <HighlightableContent ref={contentRef}>
          {mdxSource ? (
            <MDXRemote components={mdxComponents} {...mdxSource} />
          ) : (
            <FallbackContent>{post.content}</FallbackContent>
          )}

          {/* Highlight overlay - renders highlight marks and reaction gutter */}
          {highlights && (
            <HighlightOverlay
              containerRef={contentRef}
              highlights={highlights}
              currentUserId={convexUser?._id?.toString()}
              newHighlightIds={newHighlightIds}
              onHighlightClick={handleHighlightClick}
              commentCounts={highlightCommentCounts || {}}
              reactionsByHighlight={highlightReactions || {}}
            />
          )}
        </HighlightableContent>
      </PostContainer>

      {/* Selection toolbar - appears when text is selected */}
      <SelectionToolbar
        isVisible={selection.isActive}
        rect={selection.rect}
        anchor={selection.anchor}
        isSignedIn={!!isSignedIn}
        onHighlight={handleHighlight}
        onComment={handleComment}
        onReact={handleReact}
        isHighlighting={isHighlighting}
      />

      {/* Comment input - appears when user clicks Comment */}
      <SelectionCommentInput
        isVisible={!!pendingComment}
        position={pendingComment?.position || null}
        selectedText={pendingComment?.selectedText || ""}
        onSubmit={handleCommentSubmit}
        onCancel={handleCommentCancel}
        isSubmitting={isSubmittingComment}
      />

      {/* Inline comment bubble - shows when clicking on a highlight */}
      <InlineCommentBubble
        highlightId={activeHighlightId || ""}
        highlightedText={activeHighlight?.highlightedText || ""}
        rect={activeHighlightRect}
        isExpanded={!!activeHighlightId}
        comments={activeHighlightComments || []}
        isSignedIn={!!isSignedIn}
        onToggle={() => {}}
        onSubmit={handleInlineCommentSubmit}
        onClose={handleCloseInlineComment}
        isReactionOnly={activeHighlight?.isReactionOnly}
        highlightAuthor={activeHighlight?.user}
      />

      {/* Highlight modal - shows all highlights */}
      <HighlightModal
        isOpen={highlightModalOpen}
        onClose={() => setHighlightModalOpen(false)}
        highlightsByUser={highlightsWithDetails?.byUser || []}
        totalCount={highlightCounts?.total || 0}
        onScrollToHighlight={scrollToHighlight}
        currentUserId={convexUser?._id?.toString()}
        onDelete={handleDeleteHighlight}
        reactionsByHighlight={highlightReactions || {}}
      />

      {post.contentType === "article" && (
        <InfoBanner>
          <InfoLabel>INFO</InfoLabel>
          <InfoText>
            Nevulo articles will always be ad-free, thanks to supporters and <SuperLegendText>Super Legends</SuperLegendText>. If you enjoy this work, you can become a supporter today and get benefits.{" "}
            <InfoLink href="/support">Learn more</InfoLink>
          </InfoText>
        </InfoBanner>
      )}

      {post.contentType === "article" && (
        <ThanksSection ref={thanksSectionRef}>
          <ThanksTitle>Thanks for reading!</ThanksTitle>
          <ThanksSubtitle>
            If you found this helpful, share it with others or leave a reaction above.
          </ThanksSubtitle>

          <ShareLinks>
            <ThanksShareButton onClick={() => setShareModalOpen(true)}>
              <Share2 size={16} />
              Share this article
            </ThanksShareButton>
            {post.mediumUrl && (
              <ShareButton href={post.mediumUrl} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faMedium} />
                View on Medium
              </ShareButton>
            )}
            {post.hashnodeUrl && (
              <ShareButton href={post.hashnodeUrl} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faHashnode} />
                View on Hashnode
              </ShareButton>
            )}
            {post.devToUrl && (
              <ShareButton href={post.devToUrl} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faDev} />
                View on dev.to
              </ShareButton>
            )}
          </ShareLinks>
          <ReportLink onClick={() => setReportModalOpen(true)}>
            Report an issue
          </ReportLink>
        </ThanksSection>
      )}

      {/* Recommended Articles */}
      {post.contentType === "article" && similarArticles && similarArticles.length > 0 && (
        <RecommendedSection>
          <RecommendedTitle>Recommended for you</RecommendedTitle>
          <RecommendedGrid>
            {similarArticles.map((article) => (
              <BentoCard
                key={article._id}
                _id={article._id}
                slug={article.slug}
                title={article.title}
                description={article.description}
                contentType={article.contentType as "article" | "video" | "news"}
                coverImage={article.coverImage}
                labels={article.labels}
                difficulty={article.difficulty}
                readTimeMins={article.readTimeMins}
                bentoSize="medium"
                viewCount={article.viewCount}
                publishedAt={article.publishedAt}
                author={article.author}
              />
            ))}
          </RecommendedGrid>
        </RecommendedSection>
      )}

      {/* Comments Section */}
      <CommentSectionWrapper ref={commentSectionRef}>
        <CommentSection postId={post._id} />
      </CommentSectionWrapper>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        postId={post._id}
        postTitle={post.title}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        postId={post._id}
        postSlug={post.slug}
        postTitle={post.title}
      />

      {/* Credits Modal */}
      <CreditsModal
        isOpen={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        post={{
          title: post.title,
          content: post.content,
          author: post.author,
          collaborators: post.collaborators,
          readTimeMins: post.readTimeMins,
          coverAuthor: post.coverAuthor,
          coverAuthorUrl: post.coverAuthorUrl,
          labels: post.labels,
          aiDisclosureStatus: post.aiDisclosureStatus,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
        }}
      />

      <Head>
        <title>{`${post.title || ""} - Learn - Nevulo`}</title>
        <meta property="title" content={post.title} />
        <meta property="description" content={post.description} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Nevulo Learn" />
        <meta property="og:url" content={location} />
        <meta property="og:type" content="article" />
        <meta property="twitter:title" content={post.title} />
        <meta property="twitter:description" content={post.description} />
        <meta property="twitter:image" content={ogImage} />
        <meta property="twitter:site" content="@Nevvulo" />
        <meta property="twitter:creator" content="@Nevvulo" />
        <meta property="creator" content={post.author?.displayName || "Nevulo"} />
        <meta property="og:article:published_time" content={creationDate.toISOString()} />
        <meta property="og:article:author:username" content={post.author?.displayName || "Nevulo"} />
        <meta property="og:article:section" content="Technology" />
        {post.labels?.map((tag) => (
          <meta key={tag} property="og:article:tag" content={tag} />
        ))}
        <link rel="canonical" href={location} />
      </Head>
    </BlogView>
  );
}

const getPostImage = (src: string) => {
  if (src.startsWith("./") || src.startsWith("../")) {
    return src;
  }
  return src;
};

// Static MDX components - duplicates are stripped server-side
const mdxComponents = {
  pre: (props: any) => <CodeBlock {...props} />,
  img: (props: any) => {
    const src = getPostImage(props.src || "");
    return <PostImg loading="lazy" {...props} src={src} />;
  },
  a: (props: any) => {
    const href = props.href || "";
    if (isDiscordInvite(href)) {
      return <DiscordLink href={href} />;
    }
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    if (isExternal) {
      return (
        <ExternalLink
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecorationThickness: "0.125em", fontSize: "0.975em" }}
        >
          {props.children}
          <ExternalIcon icon={faExternalLinkAlt} />
        </ExternalLink>
      );
    }
    return (
      <IconLink
        style={{ textDecorationThickness: "0.125em", fontSize: "0.975em" }}
        isExternal={false}
        {...props}
        href={href}
      >
        {props.children}
      </IconLink>
    );
  },
  strong: (props: any) => <BoldText {...props} />,
  h1: (props: any) => <Title {...props} />,
  h2: (props: any) => <Subtitle {...props} />,
  h3: (props: any) => <Heading3 {...props} />,
  h4: (props: any) => <Heading4 {...props} />,
  p: (props: any) => <Text {...props} />,
  ol: (props: any) => <DotpointList {...props} />,
  ul: (props: any) => <NumberedList {...props} />,
  li: (props: any) => <ListItem {...props} />,
};

// Styled components for shared element transitions
const HeroTitleWrapper = styled(m.div)`
  will-change: opacity, transform;

  h1 {
    margin-top: 0;
    margin-bottom: 2px;
    font-size: clamp(28px, 5vw, 42px);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 700;
    letter-spacing: -0.5px;
    line-height: 1.2;
    max-width: 100%;
    width: 100%;
    color: white;

    @media (min-width: 676px) {
      font-size: clamp(36px, 4.5vw, 52px);
    }

    @media (min-width: 1024px) {
      font-size: clamp(42px, 4vw, 58px);
      letter-spacing: -1px;
    }

    @media (min-width: 1400px) {
      font-size: clamp(48px, 3.5vw, 64px);
    }
  }
`;

const HeroDescriptionWrapper = styled(m.div)`
  will-change: opacity;

  h3 {
    font-size: 16px;
    color: #b5b5b5;
    font-family: "Roboto", sans-serif;
    letter-spacing: 0px;
    font-weight: 400;
    margin-top: 0.2em;
    max-width: 100%;
  }
`;

const ContentTitleWrapper = styled(m.div)`
  will-change: opacity, transform;
  margin-bottom: 0.5em;
`;

const ContentTitle = styled.h1`
  margin-top: 0;
  letter-spacing: -1.25px;
  margin-bottom: 0.5em;
  font-size: 1.9em;
  color: ${(props) => props.theme.contrast};

  @media (max-width: 768px) {
    font-size: 1.5em;
  }

  @media (max-width: 480px) {
    font-size: 1.35em;
  }
`;

const ContentDescription = styled.p`
  color: ${(props) => props.theme.textColor};
  line-height: 1.85;
  font-size: 1.1em;
  font-weight: 400;
  letter-spacing: 0.2px;
  margin: 0.5em 0 1.25em;
  font-family: var(--font-sans);

  @media (max-width: 768px) {
    font-size: 1em;
    line-height: 1.75;
  }

  @media (max-width: 480px) {
    font-size: 0.95em;
    line-height: 1.7;
  }
`;

// Styled components
const ExternalLink = styled.a`
  color: #9074f2;
  font-family: var(--font-mono);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const ExternalIcon = styled(FontAwesomeIcon)`
  width: 10px;
  height: 10px;
  margin-left: 4px;
  color: #bbbbbb;
  vertical-align: baseline;
`;

const AuthorAvatarInline = styled.img`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  vertical-align: middle;
`;

const AuthorList = styled.span`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
`;

const AuthorChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  strong {
    color: inherit;
  }
`;

const AuthorTrigger = styled(UserPopoutTrigger)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 4px;

  &:hover strong {
    text-decoration: underline;
  }
`;

const AuthorSeparator = styled.span`
  display: inline;
  position: relative;
  top: -2px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 2px;
`;

const NotFoundContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${(props) => props.theme.contrast};

  h1 {
    font-size: 28px;
    margin-bottom: 16px;
  }

  p {
    color: ${(props) => props.theme.textColor};
  }
`;

const VideoContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto 40px;
  padding: 0 24px;
`;

const VideoWrapper = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const FallbackContent = styled.div`
  white-space: pre-wrap;
  font-family: var(--font-sans);
  color: ${(props) => props.theme.textColor};
  line-height: 1.8;
`;

const IconContainer = styled(Container).attrs({ direction: "row" })`
  margin: 1em 0 0 0;

  * {
    margin-left: 6px;
    margin-right: 6px;
    height: 32px;
  }
`;

const HeroActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

const HighlightableContent = styled.div`
  position: relative;
  overflow: visible;
`;

// Scroll-aware reading focus overlay
function ReadingFocusOverlay() {
  const [showTopShadow, setShowTopShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopShadow(window.scrollY > 64);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <ReadingFocusOverlayStyled $showTopShadow={showTopShadow} />;
}

const ReadingFocusOverlayStyled = styled.div<{ $showTopShadow: boolean }>`
  pointer-events: none;
  position: fixed;
  left: 0;
  right: 0;
  z-index: 10;

  &::before,
  &::after {
    content: '';
    position: fixed;
    left: 0;
    right: 0;
    height: 15vh;
    pointer-events: none;
  }

  &::before {
    top: 0;
    background: linear-gradient(
      to bottom,
      ${(props) => props.theme.background} 0%,
      ${(props) => props.theme.background}ee 25%,
      ${(props) => props.theme.background}99 50%,
      ${(props) => props.theme.background}44 75%,
      transparent 100%
    );
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(1px);
    mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
    opacity: ${(props) => (props.$showTopShadow ? 1 : 0)};
    transition: opacity 0.2s ease;
  }

  &::after {
    bottom: 0;
    height: 12vh;
    background: linear-gradient(
      to top,
      ${(props) => props.theme.background} 0%,
      ${(props) => props.theme.background}cc 30%,
      ${(props) => props.theme.background}66 60%,
      transparent 100%
    );
    backdrop-filter: blur(0.5px);
    -webkit-backdrop-filter: blur(0.5px);
    mask-image: linear-gradient(to top, black 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to top, black 0%, transparent 100%);
  }
`;

const BlogStyle = createGlobalStyle`
  body {
    counter-reset: page-list-counter;
  }

  pre {
    font-size: 0.9em;
    margin: 1.5em 0;
    border-radius: 8px;

    @media (max-width: 768px) {
      font-size: 0.85em;
    }

    @media (max-width: 480px) {
      font-size: 0.8em;
    }
  }

  h1, h2, h3, h4, h5, h6, p, span, li, ul {
    code {
      background: rgba(150, 150, 150, 0.25);
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-weight: 500;
      color: ${(props) => props.theme.contrast};
    }
  }

  p, span, li, ul {
    code {
      font-size: 0.85em;
    }
  }

  a > code {
    text-decoration-thickness: 0.1em;
  }

  a {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  blockquote {
    border-left: 3px solid rgba(255, 255, 255, 0.3);
    margin: 1.5em 0;
    padding: 0.5em 0 0.5em 1.5em;
    font-style: italic;
    font-size: 1em;
    opacity: 0.9;
  }
`;

const ListItem = styled.li`
  color: ${(props) => props.theme.textColor};
  font-size: 1em;
  line-height: 1.75;
  margin-bottom: 0.35em;

  h1, h2, h3, h4, h5, h6 {
    font-size: 1em;
    margin: 0.5em 0 0.25em 0;
    font-weight: 600;
  }

  p {
    font-size: 1em;
    margin: 0.25em 0;
  }
`;

const NumberedList = styled.ul`
  color: ${(props) => props.theme.textColor};
  line-height: 1.75;
  font-size: 1em;
  margin: 0 0 1em 0;
  padding-left: 0;
  list-style: none;

  & > li {
    position: relative;
    padding-left: 1.5em;
    margin-bottom: 0.5em;
  }

  & > li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #a5a3f5;
    font-weight: bold;
    font-size: 1.2em;
  }
`;

const DotpointList = styled.ol`
  color: ${(props) => props.theme.textColor};
  line-height: 1.75;
  font-size: 1em;
  margin: 1.5em 0;
  padding-left: 0;
  list-style: none;

  & > li {
    counter-increment: page-list-counter;
    position: relative;
    padding-left: 2.5em;
    margin-bottom: 1.5em;
  }

  & > li::before {
    content: counter(page-list-counter);
    position: absolute;
    left: 0;
    top: 0;
    width: 1.6em;
    height: 1.6em;
    background: linear-gradient(135deg, rgba(79, 77, 193, 0.3), rgba(79, 77, 193, 0.15));
    border: 1px solid rgba(79, 77, 193, 0.5);
    border-radius: 50%;
    font-size: 0.85em;
    font-weight: 600;
    color: #a5a3f5;
    font-family: var(--font-mono);
    text-align: center;
    line-height: 1.6em;
  }
`;

const BoldText = styled.span`
  color: ${(props) => props.theme.contrast};
  line-height: 1.8;
  font-size: 1em;
  font-weight: 600;
  margin: initial;
  letter-spacing: 0.3px;
  font-family: var(--font-sans);
`;

const Text = styled.p`
  color: ${(props) => props.theme.textColor};
  line-height: 1.85;
  font-size: 1.1em;
  font-weight: 400;
  letter-spacing: 0.2px;
  margin: 1.25em 0;
  font-family: var(--font-sans);

  @media (max-width: 768px) {
    font-size: 1em;
    line-height: 1.75;
  }

  @media (max-width: 480px) {
    font-size: 0.95em;
    line-height: 1.7;
  }
`;

const Title = styled.h1`
  margin-top: 1.5em;
  letter-spacing: -1.25px;
  margin-bottom: 0.5em;
  font-size: 1.9em;

  @media (max-width: 768px) {
    font-size: 1.5em;
  }

  @media (max-width: 480px) {
    font-size: 1.35em;
  }
`;

const SubtitleBase = styled.h2`
  margin-top: 2em;
  margin-bottom: 0.75em;
  font-family: var(--font-mono);
  letter-spacing: -1.25px;
  font-size: 1.5em;
  font-weight: 600;
  display: flex;
  align-items: flex-start;
  gap: 0.5em;

  + p {
    margin-top: 0.5em;
  }

  @media (max-width: 768px) {
    font-size: 1.25em;
    letter-spacing: -0.75px;
  }

  @media (max-width: 480px) {
    font-size: 1.1em;
    letter-spacing: -0.5px;
  }
`;

const NumberBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4em;
  height: 1.4em;
  padding: 0.1em;
  margin-top: 1.15em;
  background: linear-gradient(135deg, rgba(79, 77, 193, 0.3), rgba(79, 77, 193, 0.15));
  border: 1px solid rgba(79, 77, 193, 0.5);
  border-radius: 50%;
  font-size: 0.5em;
  font-weight: 600;
  color: #a5a3f5;
  font-family: var(--font-mono);
`;

// Helper to generate slug from heading text for TOC navigation
const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const Subtitle = (props: any) => {
  const text = String(props.children || "");
  const match = text.match(/^(\d+)\.\s*(.*)$/);
  // Generate ID from text (strip number prefix if present)
  const idText = match ? match[2] : text;
  const id = slugify(idText);

  if (match) {
    return (
      <SubtitleBase id={id} {...props}>
        <NumberBadge>{match[1]}</NumberBadge>
        {match[2]}
      </SubtitleBase>
    );
  }

  return <SubtitleBase id={id} {...props} />;
};

const Heading3Base = styled.h3`
  margin-top: 1.75em;
  margin-bottom: 0.5em;
  font-family: var(--font-mono);
  letter-spacing: -1px;
  font-weight: 500;
  font-size: 1.25em;
  display: flex;
  align-items: flex-start;
  gap: 0.5em;

  + p {
    margin-top: 0.5em;
  }

  @media (max-width: 768px) {
    font-size: 1.1em;
    letter-spacing: -0.5px;
  }

  @media (max-width: 480px) {
    font-size: 1em;
    letter-spacing: -0.35px;
  }
`;

const Heading3 = (props: any) => {
  const text = String(props.children || "");
  const match = text.match(/^(\d+)\.\s*(.*)$/);
  // Generate ID from text (strip number prefix if present)
  const idText = match ? match[2] : text;
  const id = slugify(idText);

  if (match) {
    return (
      <Heading3Base id={id} {...props}>
        <NumberBadge>{match[1]}</NumberBadge>
        {match[2]}
      </Heading3Base>
    );
  }

  return <Heading3Base id={id} {...props} />;
};

const Heading4 = styled.h4`
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-family: var(--font-mono);
  letter-spacing: -0.35px;
  font-weight: 500;
  font-size: 1.05em;

  + p {
    margin-top: 0.5em;
  }

  @media (max-width: 768px) {
    font-size: 1em;
  }

  @media (max-width: 480px) {
    font-size: 0.95em;
  }
`;

const PostContainer = styled(m.div)`
  font-family: var(--font-sans);
  border-radius: 4px;
  margin: 0.5em;
  max-width: 750px;
  width: 90%;
  padding: 0 1em;
`;

const ThanksSection = styled.div`
  max-width: 750px;
  width: 90%;
  margin: 60px auto 40px;
  padding: 40px;
  background: linear-gradient(
    135deg,
    rgba(144, 116, 242, 0.1) 0%,
    rgba(144, 116, 242, 0.05) 100%
  );
  border: 1px solid rgba(144, 116, 242, 0.2);
  border-radius: 20px;
  text-align: center;
`;

const ThanksTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #9074f2, #b794f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: var(--font-sans);
`;

const ThanksSubtitle = styled.p`
  margin: 0 0 24px;
  font-size: 16px;
  color: ${(props) => props.theme.textColor};
  line-height: 1.6;
`;

const ShareLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
`;

const ShareButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: rgba(144, 116, 242, 0.2);
    transform: translateY(-2px);
  }
`;

const HeroActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: rgba(144, 116, 242, 0.2);
    border-color: rgba(144, 116, 242, 0.4);
    color: white;
    transform: translateY(-1px);
  }
`;

const ThanksShareButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(144, 116, 242, 0.15);
  border: 1px solid rgba(144, 116, 242, 0.3);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: rgba(144, 116, 242, 0.25);
    border-color: rgba(144, 116, 242, 0.5);
    transform: translateY(-2px);
  }
`;

const RecommendedSection = styled.div`
  max-width: 900px;
  width: 90%;
  margin: 60px auto 40px;
`;

const CommentSectionWrapper = styled.div`
  max-width: 900px;
  width: 90%;
  margin: 0 auto 40px;
`;

const RecommendedTitle = styled.h3`
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
`;

const RecommendedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const InfoBanner = styled.div`
  max-width: 750px;
  width: 90%;
  margin: 40px auto 0;
  padding: 14px 18px;
  background: rgba(88, 101, 242, 0.08);
  border-left: 3px solid #5865f2;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const InfoLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #5865f2;
  flex-shrink: 0;
  padding-top: 2px;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
  line-height: 1.5;
`;

const InfoLink = styled(Link)`
  color: #5865f2;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const SuperLegendText = styled.span`
  font-weight: 600;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ReportLink = styled.button`
  margin-top: 24px;
  background: none;
  border: none;
  color: rgba(255, 100, 100, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: rgba(255, 100, 100, 1);
    text-decoration: underline;
  }
`;

// Fetch post from Convex and serialize MDX server-side
export async function getServerSideProps({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Check feature flag for title animation
  const enableTitleAnimation = await isLearnTitleAnimationEnabled();

  // Create Convex HTTP client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  try {
    // Fetch post from Convex
    const post = await convex.query(api.blogPosts.getBySlug, { slug });

    if (!post || post.status !== "published") {
      return { props: { post: null, mdxSource: null, discordWidget: null, enableTitleAnimation, hasDuplicateTitle: false, hasDuplicateDescription: false } };
    }

    // Detect if content starts with duplicate title/description
    const normalizeForComparison = (text: string): string => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' '); // Normalize whitespace
    };

    const detectDuplicates = (content: string, title: string, description: string): { hasDuplicateTitle: boolean; hasDuplicateDescription: boolean } => {
      const lines = content.trim().split('\n');
      if (lines.length < 1) return { hasDuplicateTitle: false, hasDuplicateDescription: false };

      // Check if first line is a markdown h1 matching the title
      const firstLine = lines[0];
      if (!firstLine) return { hasDuplicateTitle: false, hasDuplicateDescription: false };
      const firstLineTrimmed = firstLine.trim();
      const hasDuplicateTitle = firstLineTrimmed.startsWith('# ') &&
        normalizeForComparison(firstLineTrimmed.slice(2)) === normalizeForComparison(title);

      // Look for description match in the first few paragraphs (skip empty lines)
      let hasDuplicateDescription = false;
      for (let i = 1; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        if (!line) continue;
        const lineTrimmed = line.trim();
        if (lineTrimmed === '') continue;
        if (lineTrimmed.startsWith('#')) break; // Hit another heading
        if (normalizeForComparison(lineTrimmed) === normalizeForComparison(description)) {
          hasDuplicateDescription = true;
        }
        break; // Only check the first non-empty line after title
      }

      return { hasDuplicateTitle, hasDuplicateDescription };
    };

    const { hasDuplicateTitle, hasDuplicateDescription } = detectDuplicates(post.content, post.title, post.description);

    // Strip duplicate title/description from content before MDX serialization
    let processedContent = post.content;
    if (hasDuplicateTitle || hasDuplicateDescription) {
      const lines = processedContent.split('\n');
      let linesToRemove = 0;

      // Remove first h1 if it matches title
      if (hasDuplicateTitle && lines[0]?.trim().startsWith('# ')) {
        linesToRemove = 1;
        // Skip any empty lines after title
        while (linesToRemove < lines.length && lines[linesToRemove]?.trim() === '') {
          linesToRemove++;
        }
      }

      // Remove first paragraph if it matches description
      if (hasDuplicateDescription && linesToRemove < lines.length) {
        const nextLine = lines[linesToRemove]?.trim();
        if (nextLine && !nextLine.startsWith('#') && normalizeForComparison(nextLine) === normalizeForComparison(post.description)) {
          linesToRemove++;
          // Skip any empty lines after description
          while (linesToRemove < lines.length && lines[linesToRemove]?.trim() === '') {
            linesToRemove++;
          }
        }
      }

      processedContent = lines.slice(linesToRemove).join('\n');
    }

    // Serialize MDX content
    // Escape curly braces outside of code blocks to prevent MDX from interpreting them as JSX
    const escapeCurlyBraces = (content: string): string => {
      const codeBlockRegex = /```[\s\S]*?```|`[^`\n]+`/g;
      const codeBlocks: string[] = [];

      // Replace code blocks with placeholders
      const withPlaceholders = content.replace(codeBlockRegex, (match) => {
        codeBlocks.push(match);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
      });

      // Escape curly braces outside code blocks
      const escaped = withPlaceholders
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}');

      // Restore code blocks
      return escaped.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => codeBlocks[parseInt(index)] ?? '');
    };

    let mdxSource: MDXRemoteSerializeResult | null = null;
    try {
      const escapedContent = escapeCurlyBraces(processedContent);
      mdxSource = await serialize(escapedContent, {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          development: process.env.NODE_ENV === "development",
        },
      });
    } catch (mdxError) {
      console.error("MDX serialization error:", mdxError);
      // Fall back to raw content
    }

    // Fetch Discord widget
    const discordWidget = await fetchDiscordWidget();

    return {
      props: {
        post: JSON.parse(JSON.stringify(post)), // Serialize Convex types
        mdxSource,
        discordWidget,
        enableTitleAnimation,
        hasDuplicateTitle,
        hasDuplicateDescription,
      },
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return { props: { post: null, mdxSource: null, discordWidget: null, enableTitleAnimation: false, hasDuplicateTitle: false, hasDuplicateDescription: false } };
  }
}
