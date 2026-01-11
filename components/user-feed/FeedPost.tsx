import { useState, useCallback } from "react";
import styled from "styled-components";
import { m, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Repeat2,
  Loader2,
  Clock,
  FileText,
  Play,
  Newspaper,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LOUNGE_COLORS } from "@/constants/lounge";
import { renderSafeMarkdown } from "@/lib/safeMd";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";
import { FeedComposer } from "./FeedComposer";

interface Author {
  _id: Id<"users">;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  tier?: string;
  isCreator?: boolean;
}

interface Reactions {
  total: number;
  byType: Record<string, number>;
}

interface RepostedBlogPost {
  _id: Id<"blogPosts">;
  slug: string;
  title: string;
  description: string;
  contentType: "article" | "video" | "news";
  coverImage?: string;
  youtubeId?: string;
  labels: string[];
  readTimeMins?: number;
}

export interface FeedPostData {
  _id: Id<"userFeedPosts">;
  authorId: Id<"users">;
  profileUserId: Id<"users">;
  content: string;
  replyDepth: number;
  replyCount: number;
  media?: Array<{
    type: "image" | "video";
    url: string;
    filename: string;
    width?: number;
    height?: number;
  }>;
  isDeleted: boolean;
  createdAt: number;
  editedAt?: number;
  author: Author | null;
  reactions: Reactions;
  replies?: FeedPostData[];
  hasMoreReplies?: boolean;
  repostOfFeedId?: Id<"userFeedPosts">;
  repostedFeedPost?: FeedPostData & { author: Author | null } | null;
  repostOfPostId?: Id<"blogPosts">;
  repostedPost?: RepostedBlogPost | null;
}

interface FeedPostProps {
  post: FeedPostData;
  depth?: number;
  maxVisualDepth?: number;
  onReply?: (postId: Id<"userFeedPosts">) => void;
  currentUserId?: Id<"users">;
  isProfileOwner?: boolean;
  profileUserId?: Id<"users">;
  onReplySuccess?: () => void;
  // Thread focusing - bubbles up to FeedList to render at full width
  onFocusThread?: (post: FeedPostData, breadcrumb: string[]) => void;
}

// Depth at which we stop nesting and offer "expand thread" instead
const THREAD_FOCUS_DEPTH = 2;

export function FeedPost({
  post,
  depth = 0,
  maxVisualDepth = 3,
  onReply,
  currentUserId,
  isProfileOwner = false,
  profileUserId,
  onReplySuccess,
  onFocusThread,
}: FeedPostProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [isReplying, setIsReplying] = useState(false);

  const toggleReaction = useMutation(api.userFeed.toggleReaction);
  const deletePostMutation = useMutation(api.userFeed.deletePost);
  const repostMutation = useMutation(api.userFeed.repost);
  const userReaction = useQuery(api.userFeed.getUserReaction, { postId: post._id });
  const hasReposted = useQuery(api.userFeed.hasUserReposted, { postId: post._id });
  const [isReposting, setIsReposting] = useState(false);

  // Check if this is a repost (feed post or blog post)
  const isFeedRepost = !!post.repostOfFeedId && !!post.repostedFeedPost;
  const isBlogRepost = !!post.repostOfPostId && !!post.repostedPost;
  const isRepost = isFeedRepost || isBlogRepost;

  // Fetch replies on demand for posts without loaded replies
  const needsRepliesFetch = post.replyCount > 0 && (!post.replies || post.replies.length === 0);
  const fetchedReplies = useQuery(
    api.userFeed.getReplies,
    needsRepliesFetch ? { parentId: post._id, limit: 20 } : "skip"
  );

  // Use fetched replies if we don't have them inline
  const effectiveReplies = post.replies && post.replies.length > 0
    ? post.replies
    : fetchedReplies?.replies ?? [];

  const canDelete = currentUserId === post.authorId || isProfileOwner;
  const canEdit = currentUserId === post.authorId;
  const visualDepth = Math.min(depth, maxVisualDepth);

  const handleReaction = useCallback(async (type: "like" | "heart" | "fire") => {
    try {
      await toggleReaction({ postId: post._id, type });
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  }, [toggleReaction, post._id]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePostMutation({ postId: post._id });
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  }, [deletePostMutation, post._id]);

  // Reply handling - inline composer available at any depth
  const canReplyInline = profileUserId && currentUserId;

  const handleReplyClick = useCallback(() => {
    if (canReplyInline) {
      setIsReplying(true);
    } else if (onReply) {
      onReply(post._id);
    }
  }, [canReplyInline, onReply, post._id]);

  const handleRepostClick = useCallback(async () => {
    if (!currentUserId || isReposting || hasReposted) return;
    // Don't allow reposting your own posts
    if (post.authorId === currentUserId) return;

    setIsReposting(true);
    try {
      // Don't repost a repost - repost the original instead
      const targetPostId = post.repostOfFeedId || post._id;
      await repostMutation({ originalPostId: targetPostId });
    } catch (err) {
      console.error("Failed to repost:", err);
    } finally {
      setIsReposting(false);
    }
  }, [currentUserId, isReposting, hasReposted, post.authorId, post._id, post.repostOfFeedId, repostMutation]);

  const handleReplySuccessInternal = useCallback(() => {
    setIsReplying(false);
    onReplySuccess?.();
  }, [onReplySuccess]);

  // Should we show nested replies inline or show preview cards?
  const shouldNestInline = depth < THREAD_FOCUS_DEPTH;

  // Handler to focus a thread - bubbles up to FeedList with breadcrumb
  const handleThreadClick = useCallback((reply: FeedPostData) => {
    if (onFocusThread) {
      // Build breadcrumb from current post + reply author
      const breadcrumb = [
        post.author?.displayName || "Unknown",
        reply.author?.displayName || "Unknown"
      ];
      onFocusThread(reply, breadcrumb);
    }
  }, [onFocusThread, post.author?.displayName]);

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <PostContainer $depth={visualDepth}>

      <PostContent $isRepost={isRepost}>
        {/* Repost indicator */}
        {isRepost && (
          <RepostIndicator>
            <Repeat2 size={14} />
            <span>
              {post.author?.displayName || "Someone"} shared
              {isBlogRepost ? " an article" : " a post"}
            </span>
          </RepostIndicator>
        )}

        <PostHeader>
          <AuthorSection>
            {post.author?.avatarUrl ? (
              <AuthorAvatar
                as={Link}
                href={`/@${post.author.username || post.author._id}`}
              >
                <AvatarImg src={post.author.avatarUrl} alt={post.author.displayName} />
              </AuthorAvatar>
            ) : (
              <AvatarPlaceholder />
            )}
            <AuthorInfo>
              <AuthorName
                as={Link}
                href={`/@${post.author?.username || post.author?._id}`}
              >
                {post.author?.displayName || "Unknown"}
                {post.author?.isCreator && <CreatorBadge>Creator</CreatorBadge>}
              </AuthorName>
              <PostMeta>
                <span>{timeAgo}</span>
                {post.editedAt && <span> (edited)</span>}
              </PostMeta>
            </AuthorInfo>
          </AuthorSection>

          {(canDelete || canEdit) && (
            <ActionsButton onClick={() => setShowActions(!showActions)}>
              <MoreHorizontal size={16} />
            </ActionsButton>
          )}

          <AnimatePresence>
            {showActions && (
              <ActionsMenu
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                {canEdit && (
                  <ActionItem>
                    <Edit3 size={14} />
                    Edit
                  </ActionItem>
                )}
                {canDelete && (
                  <ActionItem onClick={handleDelete} $danger>
                    <Trash2 size={14} />
                    Delete
                  </ActionItem>
                )}
              </ActionsMenu>
            )}
          </AnimatePresence>
        </PostHeader>

        {post.content && post.content.trim() && (
          <PostBody dangerouslySetInnerHTML={renderSafeMarkdown(post.content)} />
        )}

        {post.media && post.media.length > 0 && (
          <MediaGrid $count={post.media.length}>
            {post.media.map((media, index) => (
              <MediaItem key={index}>
                {media.type === "image" ? (
                  <MediaImage src={media.url} alt={media.filename} />
                ) : (
                  <MediaVideo src={media.url} controls />
                )}
              </MediaItem>
            ))}
          </MediaGrid>
        )}

        {/* Reposted feed post display */}
        {isFeedRepost && post.repostedFeedPost && (
          <RepostedContent>
            <RepostedHeader>
              {post.repostedFeedPost.author?.avatarUrl ? (
                <RepostedAvatar
                  as={Link}
                  href={`/@${post.repostedFeedPost.author.username || post.repostedFeedPost.author._id}`}
                >
                  <img src={post.repostedFeedPost.author.avatarUrl} alt={post.repostedFeedPost.author.displayName} />
                </RepostedAvatar>
              ) : (
                <RepostedAvatarPlaceholder />
              )}
              <RepostedAuthorInfo>
                <RepostedAuthorName
                  as={Link}
                  href={`/@${post.repostedFeedPost.author?.username || post.repostedFeedPost.author?._id}`}
                >
                  {post.repostedFeedPost.author?.displayName || "Unknown"}
                </RepostedAuthorName>
                <RepostedMeta>
                  {formatDistanceToNow(new Date(post.repostedFeedPost.createdAt), { addSuffix: true })}
                </RepostedMeta>
              </RepostedAuthorInfo>
            </RepostedHeader>
            <RepostedBody dangerouslySetInnerHTML={renderSafeMarkdown(post.repostedFeedPost.content)} />
            {post.repostedFeedPost.media && post.repostedFeedPost.media.length > 0 && (
              <MediaGrid $count={post.repostedFeedPost.media.length}>
                {post.repostedFeedPost.media.map((media, index) => (
                  <MediaItem key={index}>
                    {media.type === "image" ? (
                      <MediaImage src={media.url} alt={media.filename} />
                    ) : (
                      <MediaVideo src={media.url} controls />
                    )}
                  </MediaItem>
                ))}
              </MediaGrid>
            )}
          </RepostedContent>
        )}

        {/* Reposted blog post display */}
        {isBlogRepost && post.repostedPost && (
          <BlogPostCard as={Link} href={`/learn/${post.repostedPost.slug}`}>
            {(post.repostedPost.coverImage || post.repostedPost.youtubeId) && (
              <BlogPostImage>
                <img
                  src={
                    post.repostedPost.youtubeId
                      ? `https://img.youtube.com/vi/${post.repostedPost.youtubeId}/maxresdefault.jpg`
                      : post.repostedPost.coverImage
                  }
                  alt={post.repostedPost.title}
                />
                {post.repostedPost.contentType === "video" && (
                  <VideoPlayIcon>
                    <Play size={24} fill="white" />
                  </VideoPlayIcon>
                )}
              </BlogPostImage>
            )}
            <BlogPostInfo>
              <BlogPostTypeTag $type={post.repostedPost.contentType}>
                {post.repostedPost.contentType === "video" ? (
                  <Play size={12} />
                ) : post.repostedPost.contentType === "news" ? (
                  <Newspaper size={12} />
                ) : (
                  <FileText size={12} />
                )}
                {post.repostedPost.contentType}
              </BlogPostTypeTag>
              <BlogPostTitle>{post.repostedPost.title}</BlogPostTitle>
              <BlogPostDescription>{post.repostedPost.description}</BlogPostDescription>
              <BlogPostMeta>
                {post.repostedPost.readTimeMins && (
                  <BlogPostReadTime>
                    <Clock size={12} />
                    {post.repostedPost.readTimeMins} min read
                  </BlogPostReadTime>
                )}
                {post.repostedPost.labels && post.repostedPost.labels.length > 0 && (
                  <BlogPostLabels>
                    {post.repostedPost.labels.slice(0, 2).map((label) => (
                      <BlogPostLabel key={label}>{label}</BlogPostLabel>
                    ))}
                  </BlogPostLabels>
                )}
              </BlogPostMeta>
            </BlogPostInfo>
          </BlogPostCard>
        )}

        <PostActions>
          <ReactionButtons>
            <ReactionButton
              onClick={() => handleReaction("heart")}
              $active={userReaction === "heart"}
            >
              <Heart size={16} fill={userReaction === "heart" ? "#ff6b6b" : "none"} />
              {(post.reactions.byType.heart || 0) + (post.reactions.byType.like || 0)}
            </ReactionButton>
          </ReactionButtons>

          <ActionButtons>
            {(canReplyInline || onReply) && (
              <ActionButton onClick={handleReplyClick} $active={isReplying}>
                <MessageCircle size={16} />
                Reply
              </ActionButton>
            )}

            {/* Repost button - only show if user is logged in and not their own post */}
            {currentUserId && post.authorId !== currentUserId && (
              <RepostButton
                onClick={handleRepostClick}
                $active={hasReposted === true}
                disabled={hasReposted === true || isReposting}
                title={hasReposted ? "Already reposted" : "Repost to your feed"}
              >
                {isReposting ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Repeat2 size={16} />
                )}
                {hasReposted ? "Reposted" : isReposting ? "Reposting..." : "Repost"}
              </RepostButton>
            )}

            {post.replyCount > 0 && (
              <ActionButton onClick={() => setShowReplies(!showReplies)}>
                {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}
              </ActionButton>
            )}
          </ActionButtons>
        </PostActions>

        {/* Inline Reply Composer */}
        <AnimatePresence>
          {isReplying && profileUserId && (
            <InlineReplyWrapper
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ReplyIndicator>
                <CornerDownRight size={14} />
                <span>Replying to {post.author?.displayName || "this post"}</span>
              </ReplyIndicator>
              <FeedComposer
                profileUserId={profileUserId}
                parentId={post._id}
                placeholder="Write a reply..."
                onSuccess={handleReplySuccessInternal}
                onCancel={() => setIsReplying(false)}
                compact
                autoFocus
              />
            </InlineReplyWrapper>
          )}
        </AnimatePresence>

        {/* Nested Replies */}
        <AnimatePresence>
          {showReplies && effectiveReplies.length > 0 && (
            <RepliesContainer
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {shouldNestInline ? (
                // Render nested inline for shallow depths
                effectiveReplies.map((reply) => (
                  <FeedPost
                    key={reply._id}
                    post={reply}
                    depth={depth + 1}
                    maxVisualDepth={maxVisualDepth}
                    onReply={onReply}
                    currentUserId={currentUserId}
                    isProfileOwner={isProfileOwner}
                    profileUserId={profileUserId}
                    onReplySuccess={onReplySuccess}
                    onFocusThread={onFocusThread}
                  />
                ))
              ) : (
                // At depth limit - show expandable thread previews (clickable cards)
                effectiveReplies.map((reply) => (
                  <ThreadPreview
                    key={reply._id}
                    onClick={() => handleThreadClick(reply)}
                  >
                    <ThreadPreviewAvatar>
                      {reply.author?.avatarUrl ? (
                        <img src={reply.author.avatarUrl} alt={reply.author.displayName} />
                      ) : (
                        <AvatarPlaceholder style={{ width: 24, height: 24 }} />
                      )}
                    </ThreadPreviewAvatar>
                    <ThreadPreviewContent>
                      <ThreadPreviewAuthor>{reply.author?.displayName || "Unknown"}</ThreadPreviewAuthor>
                      <ThreadPreviewText>{reply.content.slice(0, 80)}{reply.content.length > 80 ? "..." : ""}</ThreadPreviewText>
                    </ThreadPreviewContent>
                    <ThreadPreviewExpand>
                      {reply.replyCount > 0 && (
                        <span>{reply.replyCount} {reply.replyCount === 1 ? "reply" : "replies"}</span>
                      )}
                      <CornerDownRight size={14} />
                    </ThreadPreviewExpand>
                  </ThreadPreview>
                ))
              )}
              {(post.hasMoreReplies || fetchedReplies?.hasMore) && (
                <LoadMoreReplies>
                  Load more replies...
                </LoadMoreReplies>
              )}
            </RepliesContainer>
          )}
        </AnimatePresence>
      </PostContent>
    </PostContainer>
  );
}

// Styled Components
const PostContainer = styled.div<{ $depth: number }>`
  position: relative;
  padding-left: ${(p) => p.$depth * 6}px;
  margin-bottom: 16px;
`;

const ThreadLine = styled.div<{ $depth: number }>`
  position: absolute;
  left: ${(p) => (p.$depth - 1) * 20 + 16}px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(144, 116, 242, 0.2);

  &:hover {
    background: rgba(144, 116, 242, 0.4);
  }
`;

const PostContent = styled.div<{ $isRepost?: boolean }>`
  background: ${(p) => p.$isRepost ? "rgba(144, 116, 242, 0.03)" : "rgba(255, 255, 255, 0.03)"};
  border: 1px solid ${(p) => p.$isRepost ? "rgba(144, 116, 242, 0.15)" : "rgba(255, 255, 255, 0.08)"};
  border-radius: 12px;
  padding: 16px;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  position: relative;
`;

const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AuthorAvatar = styled.div`
  display: block;
  cursor: pointer;
`;

const AvatarImg = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(144, 116, 242, 0.2);
`;

const AuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const AuthorName = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const CreatorBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 4px;
  color: white;
`;

const PostMeta = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const ActionsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const ActionsMenu = styled(m.div)`
  position: absolute;
  top: 32px;
  right: 0;
  background: rgba(20, 17, 32, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  min-width: 120px;
  z-index: 10;
`;

const ActionItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  color: ${(p) => (p.$danger ? "#ff6b6b" : "rgba(255, 255, 255, 0.8)")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(p) => (p.$danger ? "rgba(255, 107, 107, 0.1)" : "rgba(255, 255, 255, 0.1)")};
  }
`;

const PostBody = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }
`;

const MediaGrid = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: ${(p) => (p.$count === 1 ? "1fr" : "repeat(2, 1fr)")};
  gap: 8px;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
`;

const MediaItem = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
`;

const MediaImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
`;

const MediaVideo = styled.video`
  width: 100%;
  max-height: 400px;
`;

const PostActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const ReactionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ReactionButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  background: ${(p) => (p.$active ? "rgba(144, 116, 242, 0.15)" : "transparent")};
  border-radius: 6px;
  font-size: 12px;
  color: ${(p) => (p.$active ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.5)")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.1);
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  background: ${(p) => (p.$active ? "rgba(144, 116, 242, 0.15)" : "transparent")};
  border-radius: 6px;
  font-size: 12px;
  color: ${(p) => (p.$active ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.5)")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const RepliesContainer = styled(m.div)`
  margin-top: 16px;
  overflow: hidden;
`;

const LoadMoreReplies = styled.button`
  display: block;
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  border: none;
  background: transparent;
  color: ${LOUNGE_COLORS.tier1};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
`;

const InlineReplyWrapper = styled(m.div)`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
`;

const ReplyIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);

  svg {
    opacity: 0.6;
  }
`;

// Thread preview card - shown at depth limit, clicks bubble up to FeedList
const ThreadPreview = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.08);
    border-color: rgba(144, 116, 242, 0.25);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ThreadPreviewAvatar = styled.div`
  flex-shrink: 0;

  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const ThreadPreviewContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ThreadPreviewAuthor = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2px;
`;

const ThreadPreviewText = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ThreadPreviewExpand = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  font-size: 11px;
  color: ${LOUNGE_COLORS.tier1};

  svg {
    opacity: 0.7;
  }
`;

// Repost styled components
const RepostIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(144, 116, 242, 0.15);
  font-size: 12px;
  color: ${LOUNGE_COLORS.tier1};

  svg {
    opacity: 0.8;
  }
`;

const RepostedContent = styled.div`
  margin-top: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
`;

const RepostedHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const RepostedAvatar = styled.div`
  display: block;
  cursor: pointer;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const RepostedAvatarPlaceholder = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(144, 116, 242, 0.2);
`;

const RepostedAuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const RepostedAuthorName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const RepostedMeta = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
`;

const RepostedBody = styled.div`
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }
`;

const RepostButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  background: ${(p) => (p.$active ? "rgba(46, 204, 113, 0.15)" : "transparent")};
  border-radius: 6px;
  font-size: 12px;
  color: ${(p) => (p.$active ? "#2ecc71" : "rgba(255, 255, 255, 0.5)")};
  cursor: ${(p) => (p.$active ? "default" : "pointer")};
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(46, 204, 113, 0.1);
    color: #2ecc71;
  }

  &:disabled {
    opacity: 0.7;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Blog post repost card styles
const BlogPostCard = styled.a`
  display: block;
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.05);
    border-color: rgba(144, 116, 242, 0.25);
    transform: translateY(-2px);
  }
`;

const BlogPostImage = styled.div`
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoPlayIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  color: white;
`;

const BlogPostInfo = styled.div`
  padding: 14px;
`;

const BlogPostTypeTag = styled.div<{ $type: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${(p) =>
    p.$type === "video"
      ? "rgba(255, 87, 87, 0.15)"
      : p.$type === "news"
      ? "rgba(255, 193, 7, 0.15)"
      : "rgba(144, 116, 242, 0.15)"};
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  color: ${(p) =>
    p.$type === "video"
      ? "#ff5757"
      : p.$type === "news"
      ? "#ffc107"
      : LOUNGE_COLORS.tier1};
  margin-bottom: 8px;
`;

const BlogPostTitle = styled.h4`
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  line-height: 1.4;
`;

const BlogPostDescription = styled.p`
  margin: 0 0 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BlogPostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BlogPostReadTime = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
`;

const BlogPostLabels = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BlogPostLabel = styled.span`
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
`;
