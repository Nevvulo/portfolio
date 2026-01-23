import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { m } from "framer-motion";
import {
  ChevronDown,
  ChevronsUp,
  ChevronUp,
  Flag,
  Highlighter,
  MessageSquare,
  Pencil,
  Share2,
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
  onOpenHighlights: () => void;
  heroRef: RefObject<HTMLElement>;
  thanksSectionRef: RefObject<HTMLElement>;
  commentSectionRef?: RefObject<HTMLElement>;
}

// Props for the mobile toolbar content (used by MobileTOCBar)
export interface MobileToolbarContentProps {
  postId: Id<"blogPosts">;
  postSlug: string;
  postTitle: string;
  headings: TOCItem[];
  activeHeading: string;
  highlightCount: number;
  onOpenHighlights: () => void;
  onClose: () => void;
  commentSectionRef?: RefObject<HTMLElement>;
  thanksSectionRef: RefObject<HTMLElement>;
}

export function FloatingToolbar({
  postId,
  postSlug,
  postTitle,
  headings,
  activeHeading,
  highlightCount,
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

  // Track when we've scrolled past the start of thanks section - hide toolbar from that point onwards
  useEffect(() => {
    if (!thanksSectionRef.current) return;

    const checkPosition = () => {
      if (!thanksSectionRef.current) return;
      const rect = thanksSectionRef.current.getBoundingClientRect();
      // Hide toolbar once we've scrolled past the start of the thanks section
      // Using a small offset (100px) so it hides slightly before the section starts
      setThanksReached(rect.top <= window.innerHeight - 100);
    };

    // Check on mount
    checkPosition();

    // Check on scroll
    window.addEventListener("scroll", checkPosition, { passive: true });
    return () => window.removeEventListener("scroll", checkPosition);
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
      {/* Desktop Toolbar - fixed RIGHT side, stays mounted, animate visibility */}
      <ToolbarWrapper style={{ pointerEvents: isVisible ? "auto" : "none" }}>
        <ToolbarContainer
          initial={false}
          animate={{
            opacity: isVisible ? 1 : 0,
            x: isVisible ? 0 : 12,
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

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        postId={postId}
        postTitle={postTitle}
      />
    </>
  );
}

const ToolbarWrapper = styled.div`
  position: fixed;
  z-index: 50;
  right: 24px;
  top: 120px;

  /* Hide on smaller screens - mobile uses MobileTOCBar instead */
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

// Exported mobile toolbar content component for use in MobileTOCBar
export function MobileToolbarContent({
  postId,
  postSlug,
  postTitle,
  headings,
  activeHeading,
  highlightCount,
  onOpenHighlights,
  onClose,
  commentSectionRef,
  thanksSectionRef,
}: MobileToolbarContentProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [showReactionFan, setShowReactionFan] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Check if user can edit this post
  const canEdit = useQuery(api.blogPosts.canEdit, { postId });

  // Navigation functions
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
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
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
    onClose();
  }, [postSlug, postTitle, onClose]);

  const handleComment = useCallback(() => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/learn/${postSlug}`);
      return;
    }

    if (commentSectionRef?.current) {
      commentSectionRef.current.scrollIntoView({ behavior: "instant", block: "start" });
    } else {
      thanksSectionRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    }
    onClose();
  }, [isSignedIn, router, postSlug, commentSectionRef, thanksSectionRef, onClose]);

  const handleEdit = useCallback(() => {
    router.push(`/editor/content/${postSlug}`);
    onClose();
  }, [router, postSlug, onClose]);

  const currentIndex = headings.findIndex((h) => h.id === activeHeading);
  const canGoNext = currentIndex < headings.length - 1;
  const canGoPrev = currentIndex > 0;

  return (
    <>
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
          onClose();
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
          onClose();
        }}
      />

      <MobileDivider />

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
        onClick={() => {
          setReportModalOpen(true);
        }}
        variant="danger"
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        postId={postId}
        postTitle={postTitle}
      />
    </>
  );
}

const MobileDivider = styled.div`
  width: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 4px auto;
`;

export default FloatingToolbar;
