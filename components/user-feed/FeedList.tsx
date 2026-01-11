import { useQuery } from "convex/react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, Loader2, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { FeedComposer } from "./FeedComposer";
import { FeedPost, type FeedPostData } from "./FeedPost";

interface FeedListProps {
  profileUserId: Id<"users">;
  currentUserId?: Id<"users">;
  isProfileOwner?: boolean;
  canPost?: boolean;
  requiresApproval?: boolean;
}

// Thread focus stack - allows infinite depth navigation
interface FocusedThread {
  post: FeedPostData;
  breadcrumb: string[]; // Author names for breadcrumb trail
}

export function FeedList({
  profileUserId,
  currentUserId,
  isProfileOwner = false,
  canPost = false,
  requiresApproval = false,
}: FeedListProps) {
  const [cursor, setCursor] = useState<Id<"userFeedPosts"> | undefined>(undefined);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<Id<"userFeedPosts"> | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Thread focus stack - when navigating into deep threads
  const [focusStack, setFocusStack] = useState<FocusedThread[]>([]);

  // Fetch posts
  const feedData = useQuery(api.userFeed.list, {
    profileUserId,
    limit: 20,
    cursor,
  });

  // Update posts when new data arrives
  useEffect(() => {
    if (feedData?.posts) {
      if (cursor) {
        // Append to existing posts
        setAllPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const newPosts = feedData.posts.filter((p: any) => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      } else {
        // Replace posts (initial load or refresh)
        setAllPosts(feedData.posts);
      }
    }
  }, [feedData?.posts, cursor]);

  const handleLoadMore = useCallback(() => {
    if (feedData?.nextCursor) {
      setCursor(feedData.nextCursor);
    }
  }, [feedData?.nextCursor]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !feedData?.hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [handleLoadMore, feedData?.hasMore]);

  const handleReply = useCallback((postId: Id<"userFeedPosts">) => {
    setReplyingTo(postId);
  }, []);

  const handleReplySuccess = useCallback(() => {
    setReplyingTo(null);
    // Refresh feed
    setCursor(undefined);
  }, []);

  const handleReplyCancel = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handlePostSuccess = useCallback(() => {
    // Refresh feed
    setCursor(undefined);
    setAllPosts([]);
  }, []);

  // Thread focus handlers - for infinite depth navigation
  const handleFocusThread = useCallback((post: FeedPostData, breadcrumb: string[]) => {
    setFocusStack((prev) => [...prev, { post, breadcrumb }]);
  }, []);

  const handleBackFromThread = useCallback(() => {
    setFocusStack((prev) => prev.slice(0, -1));
  }, []);

  const handleBackToRoot = useCallback(() => {
    setFocusStack([]);
  }, []);

  const isLoading = feedData === undefined;
  const isEmpty = !isLoading && allPosts.length === 0;
  const currentFocus = focusStack.length > 0 ? focusStack[focusStack.length - 1] : null;

  // If we have a focused thread, render it at full width instead of the feed
  if (currentFocus) {
    const fullBreadcrumb = focusStack.flatMap((f) => f.breadcrumb);
    return (
      <FeedContainer>
        <FocusedThreadView
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <FocusedHeader>
            <BackButton onClick={handleBackFromThread}>
              <ChevronLeft size={18} />
              Back
            </BackButton>
            {focusStack.length > 1 && (
              <BackToRootButton onClick={handleBackToRoot}>Back to feed</BackToRootButton>
            )}
            <Breadcrumb>
              {fullBreadcrumb.slice(-3).map((name, i) => (
                <span key={i}>
                  {i > 0 && " › "}
                  {name}
                </span>
              ))}
            </Breadcrumb>
          </FocusedHeader>

          {/* Render the focused post at FULL WIDTH (depth 0) */}
          <FeedPost
            post={currentFocus.post}
            depth={0}
            currentUserId={currentUserId}
            isProfileOwner={isProfileOwner}
            profileUserId={profileUserId}
            onReply={handleReply}
            onReplySuccess={handleReplySuccess}
            onFocusThread={handleFocusThread}
          />
        </FocusedThreadView>
      </FeedContainer>
    );
  }

  return (
    <FeedContainer>
      {/* Composer for new posts */}
      {canPost && (
        <FeedComposer
          profileUserId={profileUserId}
          requiresApproval={requiresApproval}
          onSuccess={handlePostSuccess}
        />
      )}

      {/* Posts */}
      <PostsList>
        {isLoading ? (
          <LoadingState>
            <Loader2 size={24} className="spin" />
            <span>Loading feed...</span>
          </LoadingState>
        ) : isEmpty ? (
          <EmptyState>
            <MessageSquare size={48} />
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>
              {canPost
                ? "Be the first to post on this feed!"
                : "This feed doesn't have any posts yet."}
            </EmptyDescription>
          </EmptyState>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {allPosts.map((post) => (
                <m.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <FeedPost
                    post={post}
                    currentUserId={currentUserId}
                    isProfileOwner={isProfileOwner}
                    profileUserId={profileUserId}
                    onReply={handleReply}
                    onReplySuccess={handleReplySuccess}
                    onFocusThread={handleFocusThread}
                  />

                  {/* Reply composer for top-level posts */}
                  <AnimatePresence>
                    {replyingTo === post._id && (
                      <ReplyComposerWrapper
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FeedComposer
                          profileUserId={profileUserId}
                          parentId={post._id}
                          placeholder={`Reply to ${post.author?.displayName || "this post"}...`}
                          requiresApproval={requiresApproval && !isProfileOwner}
                          onSuccess={handleReplySuccess}
                          onCancel={handleReplyCancel}
                          compact
                        />
                      </ReplyComposerWrapper>
                    )}
                  </AnimatePresence>
                </m.div>
              ))}
            </AnimatePresence>

            {/* Load more trigger */}
            {feedData?.hasMore && (
              <LoadMoreTrigger ref={loadMoreRef}>
                <Loader2 size={20} className="spin" />
                <span>Loading more...</span>
              </LoadMoreTrigger>
            )}
          </>
        )}
      </PostsList>
    </FeedContainer>
  );
}

// Styled Components
const FeedContainer = styled.div`
  width: 100%;
`;

const PostsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);

  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }
`;

const EmptyTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 14px;
  max-width: 300px;
`;

const ReplyComposerWrapper = styled(m.div)`
  margin-left: 20px;
  margin-bottom: 16px;
  overflow: hidden;
`;

const LoadMoreTrigger = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;

  .spin {
    animation: spin 1s linear infinite;
  }
`;

// Focused thread view - renders at FULL WIDTH
const FocusedThreadView = styled(m.div)`
  width: 100%;
`;

const FocusedHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: white;
  }
`;

const BackToRootButton = styled.button`
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  border-radius: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.7);
  }
`;

const Breadcrumb = styled.div`
  margin-left: auto;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);

  span:last-child {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }
`;
