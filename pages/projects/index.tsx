import { useQuery } from "convex/react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { BackButton } from "../../components/generics";
import { ProjectExpanded } from "../../components/project/ProjectExpanded";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

// Hook to detect mobile and orientation
function useViewport() {
  const [viewport, setViewport] = useState({
    isMobile: false,
    isLandscape: false,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({
        isMobile: width < 768,
        isLandscape: width > height,
        width,
        height,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return viewport;
}

// Dynamically import Three.js scene to avoid SSR issues
const TimelineScene = dynamic(
  () => import("../../components/project/timeline/TimelineScene").then((mod) => mod.TimelineScene),
  { ssr: false },
);

export default function ProjectsPage() {
  const router = useRouter();
  const viewport = useViewport();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedProject, setExpandedProject] = useState<Doc<"projects"> | null>(null);
  const [hasHandledExpand, setHasHandledExpand] = useState(false);
  const animationRef = useRef<number>();
  const touchStartRef = useRef<{ y: number; progress: number } | null>(null);

  // Fetch projects and timeline years from Convex
  const projects = useQuery(api.projects.listByTimeline);
  const timelineYears = useQuery(api.projects.getTimelineYears);

  // Use fetched data or empty arrays while loading
  const projectsList = projects ?? [];
  const yearsList = timelineYears ?? [];

  // Calculate current year from scroll
  const currentYearIndex = Math.min(
    Math.floor(scrollProgress * yearsList.length),
    Math.max(0, yearsList.length - 1),
  );
  const currentYear = yearsList[currentYearIndex] || new Date().getFullYear();

  // Smooth lerp animation for scroll
  useEffect(() => {
    const animate = () => {
      setScrollProgress((prev) => {
        const diff = targetProgress - prev;
        // Smooth easing - lerp towards target
        if (Math.abs(diff) < 0.0001) return targetProgress;
        return prev + diff * 0.12;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetProgress]);

  // Handle wheel for smooth scrolling through timeline
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Don't scroll if a project is expanded
      if (expandedProject) return;

      e.preventDefault();
      setTargetProgress((prev) => {
        const delta = e.deltaY * 0.0008;
        return Math.max(0, Math.min(1, prev + delta));
      });
    },
    [expandedProject],
  );

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (expandedProject) return;
      const touch = e.touches[0];
      if (!touch) return;
      touchStartRef.current = {
        y: touch.clientY,
        progress: targetProgress,
      };
    },
    [expandedProject, targetProgress],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (expandedProject || !touchStartRef.current) return;
      e.preventDefault();

      const touch = e.touches[0];
      if (!touch) return;
      const deltaY = touchStartRef.current.y - touch.clientY;
      // Adjust sensitivity based on screen height for consistent feel
      const sensitivity = 0.002 * (800 / window.innerHeight);
      const newProgress = touchStartRef.current.progress + deltaY * sensitivity;
      setTargetProgress(Math.max(0, Math.min(1, newProgress)));
    },
    [expandedProject],
  );

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  useEffect(() => {
    setIsLoaded(true);

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Handle project click - expand instead of navigate
  const handleProjectClick = useCallback((project: Doc<"projects">) => {
    setExpandedProject(project);
    // Update URL without navigation (for sharing/back button)
    window.history.pushState({}, "", `/projects/${project.slug}`);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    setExpandedProject(null);
    window.history.pushState({}, "", "/projects");
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const slug = window.location.pathname.split("/projects/")[1];
      if (slug && projectsList.length > 0) {
        const project = projectsList.find((p) => p.slug === slug);
        if (project) {
          setExpandedProject(project);
        } else {
          setExpandedProject(null);
        }
      } else {
        setExpandedProject(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [projectsList]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandedProject) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedProject, handleClose]);

  // Handle ?expand=slug query parameter
  useEffect(() => {
    if (hasHandledExpand || !router.isReady || projectsList.length === 0 || yearsList.length === 0) return;

    const expandSlug = router.query.expand;
    if (typeof expandSlug === "string") {
      const project = projectsList.find((p) => p.slug === expandSlug);
      if (project) {
        // Expand the project
        setExpandedProject(project);
        // Update URL to the proper project URL (without query param)
        window.history.replaceState({}, "", `/projects/${project.slug}`);

        // Scroll timeline to the project's year
        const projectYear = project.timeline.startYear;
        const yearIndex = yearsList.indexOf(projectYear);
        if (yearIndex !== -1) {
          const progress = yearIndex / Math.max(1, yearsList.length - 1);
          setTargetProgress(progress);
          setScrollProgress(progress);
        }
      }
      setHasHandledExpand(true);
    }
  }, [router.isReady, router.query.expand, projectsList, yearsList, hasHandledExpand]);

  return (
    <>
      <Head key="projects">
        <title>nevulo - Projects</title>
        <meta
          name="description"
          content={`Journey through ${projectsList.length} projects from ${yearsList[yearsList.length - 1] || 2016} to present.`}
        />
        <meta property="og:title" content="nevulo - Projects" />
        <meta
          property="og:description"
          content="An interactive 3D journey through my software engineering projects."
        />
        <meta property="og:url" content="https://nev.so/projects" />
        <meta property="og:site_name" content="nevulo" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Projects&subtitle=A%20Journey%20Through%20Code"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="nevulo - Projects" />
        <meta
          name="twitter:description"
          content={`An interactive 3D journey through ${projectsList.length} projects.`}
        />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Projects&subtitle=A%20Journey%20Through%20Code"
        />
      </Head>

      <PageContainer>
        {/* 3D Canvas Background */}
        {isLoaded && projectsList.length > 0 && (
          <TimelineScene
            projects={projectsList}
            timelineYears={yearsList}
            scrollProgress={scrollProgress}
            onProjectClick={handleProjectClick}
            onScrollChange={setTargetProgress}
            isMobile={viewport.isMobile}
            isLandscape={viewport.isLandscape}
          />
        )}

        {/* Loading state */}
        {(!projects || projectsList.length === 0) && (
          <LoadingContainer>
            <LoadingText>Loading projects...</LoadingText>
          </LoadingContainer>
        )}

        {/* Overlay UI */}
        <OverlayUI>
          {/* Header */}
          <Header>
            <BackButton href="/" />
            <Title>projects</Title>
          </Header>

          {/* Progress indicator */}
          {yearsList.length > 0 && (
            <ProgressContainer>
              <ProgressTrack>
                <ProgressFill
                  style={
                    {
                      height: `${scrollProgress * 100}%`,
                      "--progress": `${scrollProgress * 100}%`,
                    } as React.CSSProperties
                  }
                />
              </ProgressTrack>
              <ProgressYears>
                {yearsList
                  .filter((_, i) => i % 2 === 0)
                  .map((year) => (
                    <ProgressYear
                      key={year}
                      $active={year === currentYear}
                      onClick={() => {
                        const index = yearsList.indexOf(year);
                        setTargetProgress(index / (yearsList.length - 1));
                      }}
                    >
                      {year}
                    </ProgressYear>
                  ))}
              </ProgressYears>
            </ProgressContainer>
          )}

          {/* Scroll hint */}
          {scrollProgress < 0.1 && !expandedProject && (
            <ScrollHint $isMobile={viewport.isMobile}>
              <ScrollIcon>↓</ScrollIcon>
              <span>{viewport.isMobile ? "Swipe to explore" : "Scroll to explore timeline"}</span>
            </ScrollHint>
          )}

          {/* Instructions - hidden on mobile portrait to save space */}
          {(!viewport.isMobile || viewport.isLandscape) && (
            <Instructions $isMobile={viewport.isMobile}>
              <InstructionItem>
                {viewport.isMobile ? "Swipe to navigate" : "Scroll to travel through time"}
              </InstructionItem>
              <InstructionItem>Tap cards to view projects</InstructionItem>
            </Instructions>
          )}
        </OverlayUI>

        {/* Expanded Project Overlay */}
        <AnimatePresence>
          {expandedProject && <ProjectExpanded project={expandedProject} onClose={handleClose} />}
        </AnimatePresence>
      </PageContainer>
    </>
  );
}

const PageContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0d0d14;
`;

const LoadingContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
`;

const OverlayUI = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;

  & > * {
    pointer-events: auto;
  }
`;

const Header = styled.header`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: linear-gradient(180deg, rgba(13, 13, 20, 0.95) 0%, transparent 100%);
  z-index: 20;

  @media (max-width: 767px) {
    padding: 1rem 1rem;
  }
`;

const Title = styled.h1`
  font-size: 1rem;
  font-weight: 400;
  font-family: "Sixtyfour", monospace;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;

  @media (max-width: 767px) {
    font-size: 0.8rem;
  }
`;

const ProgressContainer = styled.div`
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 767px) {
    /* On mobile portrait, move to bottom horizontal bar */
    right: auto;
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    top: auto;
    transform: none;
    flex-direction: column;
    gap: 0.5rem;
  }

  @media (max-width: 767px) and (orientation: landscape) {
    /* On mobile landscape, keep on right but smaller */
    position: absolute;
    right: 0.75rem;
    left: auto;
    top: 50%;
    bottom: auto;
    transform: translateY(-50%);
    flex-direction: row;
    gap: 0.5rem;
  }
`;

const ProgressTrack = styled.div`
  width: 4px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;

  @media (max-width: 767px) {
    /* Horizontal on mobile portrait */
    width: 100%;
    height: 4px;
  }

  @media (max-width: 767px) and (orientation: landscape) {
    /* Vertical but shorter on mobile landscape */
    width: 3px;
    height: 120px;
  }
`;

const ProgressFill = styled.div`
  width: 100%;
  background: linear-gradient(180deg, #4f46e5 0%, #6366f1 100%);
  border-radius: 2px;
  transition: height 0.1s ease-out, width 0.1s ease-out;

  @media (max-width: 767px) {
    /* Horizontal fill on mobile portrait */
    height: 100% !important;
    width: var(--progress, 0%);
    background: linear-gradient(90deg, #4f46e5 0%, #6366f1 100%);
  }

  @media (max-width: 767px) and (orientation: landscape) {
    /* Vertical fill on mobile landscape */
    width: 100%;
    height: var(--progress, 0%);
    background: linear-gradient(180deg, #4f46e5 0%, #6366f1 100%);
  }
`;

const ProgressYears = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (max-width: 767px) {
    /* Horizontal on mobile portrait */
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  @media (max-width: 767px) and (orientation: landscape) {
    /* Vertical on mobile landscape */
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const ProgressYear = styled.button<{ $active?: boolean }>`
  background: none;
  border: none;
  color: ${(p) => (p.$active ? "#6366f1" : "rgba(255, 255, 255, 0.3)")};
  font-size: 0.75rem;
  font-family: "Sixtyfour", monospace;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    color: ${(p) => (p.$active ? "#6366f1" : "rgba(255, 255, 255, 0.6)")};
  }

  @media (max-width: 767px) {
    font-size: 0.6rem;
    padding: 0.15rem 0.25rem;
  }
`;

const ScrollHint = styled.div<{ $isMobile?: boolean }>`
  position: absolute;
  bottom: ${(p) => (p.$isMobile ? "5rem" : "2rem")};
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: ${(p) => (p.$isMobile ? "0.75rem" : "0.85rem")};
  animation: bounce 2s ease-in-out infinite;

  @keyframes bounce {
    0%,
    100% {
      transform: translateX(-50%) translateY(0);
    }
    50% {
      transform: translateX(-50%) translateY(-10px);
    }
  }
`;

const ScrollIcon = styled.span`
  font-size: 1.5rem;
`;

const Instructions = styled.div<{ $isMobile?: boolean }>`
  position: absolute;
  bottom: ${(p) => (p.$isMobile ? "0.5rem" : "2rem")};
  right: ${(p) => (p.$isMobile ? "0.5rem" : "2rem")};
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
`;

const InstructionItem = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);

  @media (max-width: 767px) {
    font-size: 0.65rem;
  }
`;
