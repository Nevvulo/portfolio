import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { AnimatePresence, m } from "framer-motion";
import {
  ChevronDown,
  ChevronsUp,
  ChevronUp,
  Flag,
  Highlighter,
  MessageSquare,
  MoreVertical,
  Pencil,
  Share2,
  X,
} from "lucide-react";
import { useRouter } from "next/router";
import { type RefObject, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/lounge";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ReactionFan } from "./ReactionFan";
import { ReportModal } from "./ReportModal";
import { ToolbarButton } from "./ToolbarButton";

interface TOCItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface FloatingToolbarProps {
  postId: Id<"blogPosts">;
  postSlug: string;
  postTitle: string;
  headings: TOCItem[];
  activeHeading: string;
  highlightCount: number;
  tocCollapsed: boolean;
  onTocCollapseChange: (collapsed: boolean) => void;
  onOpenHighlights: () => void;
  heroRef: RefObject<HTMLElement>;
  thanksSectionRef: RefObject<HTMLElement>;
  commentSectionRef?: RefObject<HTMLElement>;
}

export function FloatingToolbar({
  postId,
  postSlug,
  postTitle,
  headings,
  activeHeading,
  highlightCount,
  tocCollapsed,
  onOpenHighlights,
  heroRef,
  thanksSectionRef,
  commentSectionRef,
}: FloatingToolbarProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [thanksReached, setThanksReached] = useState(false);
  const [showReactionFan, setShowReactionFan] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false);

  // Check if user can edit this post
  const canEdit = useQuery(api.blogPosts.canEdit, { postId });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track hero visibility
  useEffect(() => {
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setHeroVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [heroRef]);

  // Track when thanks section is reached - once reached, stay hidden
  useEffect(() => {
    if (!thanksSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setThanksReached(true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(thanksSectionRef.current);
    return () => observer.disconnect();
  }, [thanksSectionRef]);

  // Compute visibility: show when hero is out of view AND thanks section hasn't been reached
  const isVisible = !heroVisible && !thanksReached;

  // Navigation functions
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Use manual scroll with offset to prevent title being cut off by fixed header
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
    }
  }, []);

  const navigateToNextSection = useCallback(() => {
    const currentIndex = headings.findIndex((h) => h.id === activeHeading);
    const nextHeading = headings[currentIndex + 1];
    if (nextHeading) {
      scrollToHeading(nextHeading.id);
    }
  }, [headings, activeHeading, scrollToHeading]);

  const navigateToPrevSection = useCallback(() => {
    const currentIndex = headings.findIndex((h) => h.id === activeHeading);
    const prevHeading = headings[currentIndex - 1];
    if (prevHeading) {
      scrollToHeading(prevHeading.id);
    }
  }, [headings, activeHeading, scrollToHeading]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleShare = useCallback(async () => {
    const url = `https://nev.so/learn/${postSlug}`;
    const shareData = {
      title: postTitle,
      text: `Check out "${postTitle}" on Nevulo`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  }, [postSlug, postTitle]);

  const handleComment = useCallback(() => {
    if (!isSignedIn) {
      // Trigger auth
      router.push(`/sign-in?redirect_url=/learn/${postSlug}`);
      return;
    }

    // Jump to comments section (instant, no smooth scroll)
    if (commentSectionRef?.current) {
      commentSectionRef.current.scrollIntoView({ behavior: "instant", block: "start" });
    } else {
      // Fallback: scroll to thanks section which is near comments
      thanksSectionRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [isSignedIn, router, postSlug, commentSectionRef, thanksSectionRef]);

  const handleEdit = useCallback(() => {
    router.push(`/editor/content/${postSlug}`);
  }, [router, postSlug]);

  const currentIndex = headings.findIndex((h) => h.id === activeHeading);
  const canGoNext = currentIndex < headings.length - 1;
  const canGoPrev = currentIndex > 0;

  if (!mounted) return null;

  // Don't show if no headings
  if (headings.length === 0) return null;

  return (
    <>
      {/* Desktop Toolbar - stays mounted, animate visibility */}
      <ToolbarWrapper $tocCollapsed={tocCollapsed} style={{ pointerEvents: isVisible ? 'auto' : 'none' }}>
        <ToolbarContainer
          initial={false}
          animate={{
            opacity: isVisible ? 1 : 0,
            x: isVisible ? 0 : -12
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {/* Reactions */}
          <ReactionFan
            postId={postId}
            isExpanded={showReactionFan}
            onToggle={() => setShowReactionFan(!showReactionFan)}
          />

          {/* Highlights */}
          <ToolbarButton
            icon={Highlighter}
            label="View highlights"
            onClick={onOpenHighlights}
            badge={highlightCount}
          />

          <Divider />

          {/* Navigation */}
          <ToolbarButton
            icon={ChevronUp}
            label="Previous section"
            onClick={navigateToPrevSection}
            disabled={!canGoPrev}
          />
          <ToolbarButton
            icon={ChevronDown}
            label="Next section"
            onClick={navigateToNextSection}
            disabled={!canGoNext}
          />
          <ToolbarButton icon={ChevronsUp} label="Scroll to top" onClick={scrollToTop} />

          <Divider />

          {/* Actions */}
          <ToolbarButton icon={Share2} label="Share" onClick={handleShare} />
          <ToolbarButton
            icon={MessageSquare}
            label={isSignedIn ? "Go to comments" : "Sign in to comment"}
            onClick={handleComment}
          />

          {/* Edit (only for authorized users) */}
          {canEdit && <ToolbarButton icon={Pencil} label="Edit post" onClick={handleEdit} />}

          {/* Report */}
          <ToolbarButton
            icon={Flag}
            label="Report an issue"
            onClick={() => setReportModalOpen(true)}
            variant="danger"
          />
        </ToolbarContainer>
      </ToolbarWrapper>

      {/* Mobile Toolbar FAB - stays mounted, animate visibility */}
      <MobileToolbarWrapper style={{ pointerEvents: isVisible ? 'auto' : 'none' }}>
        {/* Click-outside overlay */}
        <AnimatePresence>
          {mobileToolbarOpen && (
            <MobileToolbarOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileToolbarOpen(false)}
            />
          )}
        </AnimatePresence>

        <MobileToolbarButton
          initial={false}
          animate={{
            opacity: isVisible ? 1 : 0,
            x: isVisible ? 0 : 12
          }}
          transition={{ duration: 0.15 }}
          onClick={() => setMobileToolbarOpen(!mobileToolbarOpen)}
          aria-label={mobileToolbarOpen ? "Close toolbar" : "Open toolbar"}
          $isOpen={mobileToolbarOpen}
        >
          {mobileToolbarOpen ? <X size={20} /> : <MoreVertical size={20} />}
        </MobileToolbarButton>

        <AnimatePresence>
          {mobileToolbarOpen && (
            <MobileToolbarExpanded
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {/* Reactions */}
              <ReactionFan
                postId={postId}
                isExpanded={showReactionFan}
                onToggle={() => setShowReactionFan(!showReactionFan)}
                expandDirection="left"
              />

              {/* Highlights */}
              <ToolbarButton
                icon={Highlighter}
                label="View highlights"
                onClick={() => {
                  onOpenHighlights();
                  setMobileToolbarOpen(false);
                }}
                badge={highlightCount}
              />

              <MobileDivider />

              {/* Navigation */}
              <ToolbarButton
                icon={ChevronUp}
                label="Previous section"
                onClick={navigateToPrevSection}
                disabled={!canGoPrev}
              />
              <ToolbarButton
                icon={ChevronDown}
                label="Next section"
                onClick={navigateToNextSection}
                disabled={!canGoNext}
              />
              <ToolbarButton
                icon={ChevronsUp}
                label="Scroll to top"
                onClick={() => {
                  scrollToTop();
                  setMobileToolbarOpen(false);
                }}
              />

              <MobileDivider />

              {/* Actions */}
              <ToolbarButton
                icon={Share2}
                label="Share"
                onClick={() => {
                  handleShare();
                  setMobileToolbarOpen(false);
                }}
              />
              <ToolbarButton
                icon={MessageSquare}
                label={isSignedIn ? "Go to comments" : "Sign in to comment"}
                onClick={() => {
                  handleComment();
                  setMobileToolbarOpen(false);
                }}
              />

              {/* Edit (only for authorized users) */}
              {canEdit && (
                <ToolbarButton
                  icon={Pencil}
                  label="Edit post"
                  onClick={() => {
                    handleEdit();
                    setMobileToolbarOpen(false);
                  }}
                />
              )}

              {/* Report */}
              <ToolbarButton
                icon={Flag}
                label="Report an issue"
                onClick={() => {
                  setReportModalOpen(true);
                  setMobileToolbarOpen(false);
                }}
                variant="danger"
              />
            </MobileToolbarExpanded>
          )}
        </AnimatePresence>
      </MobileToolbarWrapper>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        postId={postId}
        postTitle={postTitle}
      />
    </>
  );
}

const ToolbarWrapper = styled.div<{ $tocCollapsed: boolean }>`
  position: fixed;
  z-index: 50;
  left: ${(props) => (props.$tocCollapsed ? "24px" : "260px")};
  /* When collapsed, position below the TOC expand button (120px + 40px + 16px gap) */
  top: ${(props) => (props.$tocCollapsed ? "176px" : "120px")};

  /* Hide on smaller screens where TOC is hidden */
  @media (max-width: 1200px) {
    display: none;
  }
`;

const ToolbarContainer = styled(m.div)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: rgba(16, 13, 27, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
`;

const Divider = styled.div`
  width: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 4px auto;
`;

// Mobile toolbar styles
const MobileToolbarWrapper = styled.div`
  display: none;

  @media (max-width: 1200px) {
    display: block;
  }
`;

const MobileToolbarOverlay = styled(m.div)`
  position: fixed;
  inset: 0;
  z-index: 98;
`;

const MobileToolbarButton = styled(m.button)<{ $isOpen: boolean }>`
  position: fixed;
  top: 128px; /* Below TOC button (80px + 40px height + 8px gap) */
  right: 24px;
  z-index: 100;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${(props) => (props.$isOpen ? "rgba(144, 116, 242, 0.3)" : "rgba(0, 0, 0, 0.75)")};
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.3);
  }
`;

const MobileToolbarExpanded = styled(m.div)`
  position: fixed;
  top: 176px; /* Below the button (128px + 40px + 8px gap) */
  right: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: rgba(16, 13, 27, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);

  /* Short viewport: move to the left of button when toolbar won't fit below */
  @media (max-width: 1200px) and (max-height: 600px) {
    top: 80px;
    right: 72px; /* To the left of button (24px + 40px + 8px gap) */
    max-height: calc(100vh - 96px);
    overflow-y: auto;

    /* Hide scrollbar but keep functionality */
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MobileDivider = styled.div`
  width: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 4px auto;
`;

export default FloatingToolbar;
