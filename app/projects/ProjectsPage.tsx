"use client";

import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { BackButton } from "../../components/generics";
import { ProjectExpanded } from "../../components/project/ProjectExpanded";
import type { Project, Technology, Role } from "@/src/db/types";

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

const TimelineScene = dynamic(
  () => import("../../components/project/timeline/TimelineScene").then((mod) => mod.TimelineScene),
  { ssr: false },
);

interface ProjectsPageProps {
  projects: Project[];
  timelineYears: number[];
  technologies: Technology[];
  roles: Role[];
}

export default function ProjectsPage({ projects, timelineYears, technologies, roles }: ProjectsPageProps) {
  const searchParams = useSearchParams();
  const viewport = useViewport();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedProject, setExpandedProject] = useState<Project | null>(null);
  const [hasHandledExpand, setHasHandledExpand] = useState(false);
  const animationRef = useRef<number>();
  const touchStartRef = useRef<{ y: number; progress: number } | null>(null);

  const projectsList = projects;
  const yearsList = timelineYears;

  // Build lookup maps for technologies and roles
  const techMap = new Map(technologies.map((t) => [t.key, t]));
  const roleMap = new Map(roles.map((r) => [r.key, r]));

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

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (expandedProject) return;
      e.preventDefault();
      setTargetProgress((prev) => {
        const delta = e.deltaY * 0.0008;
        return Math.max(0, Math.min(1, prev + delta));
      });
    },
    [expandedProject],
  );

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

  const handleProjectClick = useCallback((project: Project) => {
    setExpandedProject(project);
    window.history.pushState({}, "", `/projects/${project.slug}`);
  }, []);

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
    if (hasHandledExpand || projectsList.length === 0 || yearsList.length === 0) return;

    const expandSlug = searchParams.get("expand");
    if (expandSlug) {
      const project = projectsList.find((p) => p.slug === expandSlug);
      if (project) {
        setExpandedProject(project);
        window.history.replaceState({}, "", `/projects/${project.slug}`);

        const timeline = project.timeline as { startYear: number };
        const projectYear = timeline.startYear;
        const yearIndex = yearsList.indexOf(projectYear);
        if (yearIndex !== -1) {
          const progress = yearIndex / Math.max(1, yearsList.length - 1);
          setTargetProgress(progress);
          setScrollProgress(progress);
        }
      }
      setHasHandledExpand(true);
    }
  }, [searchParams, projectsList, yearsList, hasHandledExpand]);

  return (
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
      {projectsList.length === 0 && (
        <LoadingContainer>
          <LoadingText>Loading projects...</LoadingText>
        </LoadingContainer>
      )}

      {/* Overlay UI */}
      <OverlayUI>
        <Header>
          <BackButton href="/" />
          <Title>projects</Title>
        </Header>

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

        {scrollProgress < 0.1 && !expandedProject && (
          <ScrollHint $isMobile={viewport.isMobile}>
            <ScrollIcon>↓</ScrollIcon>
            <span>{viewport.isMobile ? "Swipe to explore" : "Scroll to explore timeline"}</span>
          </ScrollHint>
        )}

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
        {expandedProject && (
          <ProjectExpanded
            project={expandedProject}
            onClose={handleClose}
            technologies={techMap}
            roles={roleMap}
          />
        )}
      </AnimatePresence>
    </PageContainer>
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
    width: 100%;
    height: 4px;
  }

  @media (max-width: 767px) and (orientation: landscape) {
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
    height: 100% !important;
    width: var(--progress, 0%);
    background: linear-gradient(90deg, #4f46e5 0%, #6366f1 100%);
  }

  @media (max-width: 767px) and (orientation: landscape) {
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
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  @media (max-width: 767px) and (orientation: landscape) {
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
