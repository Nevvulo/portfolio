import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, List } from "lucide-react";
import { type RefObject, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/theme";

export interface TOCItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TableOfContentsProps {
  heroRef: RefObject<HTMLElement>;
  thanksSectionRef: RefObject<HTMLElement>;
  contentRef: RefObject<HTMLElement>;
  /** Whether TOC is collapsed (controlled externally) */
  isCollapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Callback to expose headings to parent */
  onHeadingsChange?: (headings: TOCItem[]) => void;
  /** Callback to expose active heading to parent */
  onActiveHeadingChange?: (activeId: string) => void;
}

export function TableOfContents({
  heroRef,
  thanksSectionRef,
  contentRef,
  isCollapsed = false,
  onCollapseChange,
  onHeadingsChange,
  onActiveHeadingChange,
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [heroVisible, setHeroVisible] = useState(true);
  const [thanksReached, setThanksReached] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract headings from content on mount
  useEffect(() => {
    if (!contentRef.current) return;

    const extractHeadings = () => {
      const container = contentRef.current;
      if (!container) return;

      const elements = container.querySelectorAll("h2[id], h3[id]");
      const items: TOCItem[] = [];

      elements.forEach((el) => {
        const id = el.id;
        if (!id) return;

        // Get text content, handling numbered badges
        let text = el.textContent || "";
        // Clean up text (remove number badges that appear as separate text)
        text = text.replace(/^\d+\s*/, "").trim();

        const tagName = el.tagName.toLowerCase();
        const level = tagName === "h2" ? 2 : 3;

        items.push({ id, text, level });
      });

      setHeadings(items);
      onHeadingsChange?.(items);
    };

    // Wait for MDX to render
    const timeout = setTimeout(extractHeadings, 100);

    // Also listen for font loads which might affect layout
    if (document.fonts) {
      document.fonts.ready.then(extractHeadings);
    }

    return () => clearTimeout(timeout);
  }, [contentRef]);

  // Track hero visibility
  useEffect(() => {
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [heroRef]);

  // Track when thanks section is in view - hide TOC when thanks is visible
  useEffect(() => {
    if (!thanksSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          // Update based on current intersection state
          setThanksReached(entry.isIntersecting);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(thanksSectionRef.current);
    return () => observer.disconnect();
  }, [thanksSectionRef]);

  // Track active section
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that's intersecting from top
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by top position and take the topmost
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const topEntry = visibleEntries[0];
          if (topEntry) {
            setActiveId(topEntry.target.id);
            onActiveHeadingChange?.(topEntry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // Handle click navigation
  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Add offset for fixed header to prevent title being cut off
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
    }
  }, []);

  // Don't show if no headings or visibility conditions not met
  // Once thanks section is reached, hide permanently (until page refresh)
  const isVisible = !heroVisible && !thanksReached && headings.length > 0;

  if (!mounted) return null;

  const tocContent = (
    <>
      <TOCHeader>
        <TOCTitle>On this page</TOCTitle>
        {onCollapseChange && (
          <CollapseButton
            onClick={() => onCollapseChange(true)}
            aria-label="Collapse table of contents"
          >
            <ChevronLeft size={14} />
          </CollapseButton>
        )}
      </TOCHeader>
      <TOCList>
        {headings.map((heading) => (
          <TOCItem
            key={heading.id}
            $level={heading.level}
            $isActive={activeId === heading.id}
            onClick={() => handleClick(heading.id)}
          >
            {heading.text}
          </TOCItem>
        ))}
      </TOCList>
    </>
  );

  return (
    <>
      {/* Desktop TOC - fixed left (hidden when collapsed) */}
      <AnimatePresence>
        {isVisible && !isCollapsed && (
          <DesktopTOC
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {tocContent}
          </DesktopTOC>
        )}
      </AnimatePresence>

      {/* Desktop expand button - shows when TOC is collapsed */}
      <AnimatePresence>
        {isVisible && isCollapsed && onCollapseChange && (
          <DesktopExpandButton
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={() => onCollapseChange(false)}
            aria-label="Show table of contents"
          >
            <List size={18} />
          </DesktopExpandButton>
        )}
      </AnimatePresence>
    </>
  );
}

// Desktop TOC container
const DesktopTOC = styled(m.nav)`
  position: fixed;
  top: 120px;
  left: 24px;
  max-width: 220px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 16px;
  border-radius: 12px;
  background: rgba(16, 13, 27, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 50;

  /* Hide scrollbar but keep functionality */
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 116, 242, 0.3) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(144, 116, 242, 0.3);
    border-radius: 2px;
  }

  @media (max-width: 1200px) {
    display: none;
  }
`;

// Desktop expand button (shows when TOC is collapsed)
const DesktopExpandButton = styled(m.button)`
  position: fixed;
  top: 120px;
  left: 24px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(16, 13, 27, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.15);
    border-color: rgba(144, 116, 242, 0.3);
    color: ${LOUNGE_COLORS.tier1};
  }

  @media (max-width: 1200px) {
    display: none;
  }
`;

// Shared TOC elements
const TOCHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const CollapseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.2);
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const TOCTitle = styled.h3`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--font-sans);
`;

const TOCList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const TOCItem = styled.li<{ $level: 2 | 3; $isActive: boolean }>`
  padding: 8px 12px;
  padding-left: ${(props) => (props.$level === 3 ? "24px" : "12px")};
  font-size: 13px;
  font-weight: ${(props) => (props.$level === 2 ? 500 : 400)};
  color: ${(props) =>
    props.$isActive
      ? "#9074f2"
      : props.$level === 2
        ? "rgba(255, 255, 255, 0.9)"
        : "rgba(255, 255, 255, 0.6)"};
  cursor: pointer;
  border-radius: 6px;
  border-left: 2px solid ${(props) => (props.$isActive ? "#9074f2" : "transparent")};
  transition: all 0.15s ease;
  line-height: 1.4;

  &:hover {
    background: rgba(144, 116, 242, 0.1);
    color: ${(props) => (props.$isActive ? "#9074f2" : "rgba(255, 255, 255, 0.95)")};
  }
`;
