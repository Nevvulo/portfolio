import { AnimatePresence, m } from "framer-motion";
import { ChevronDown, ChevronUp, MoreVertical, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import NevuloLogo from "@/assets/svg/nevulo-huge-bold-svg.svg";
import { LOUNGE_COLORS } from "@/constants/theme";
import type { TOCItem } from "./TableOfContents";

interface MobileTOCBarProps {
  articleTitle: string;
  headings: TOCItem[];
  activeHeading: string;
  readProgress: number;
  isVisible: boolean;
  onHeadingClick: (id: string) => void;
  toolbarContent: ReactNode;
}

export function MobileTOCBar({
  articleTitle,
  headings,
  activeHeading,
  readProgress,
  isVisible,
  onHeadingClick,
  toolbarContent,
}: MobileTOCBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const tocListRef = useRef<HTMLDivElement>(null);

  // Get current section text
  const currentSection = headings.find((h) => h.id === activeHeading);
  const currentSectionText = currentSection?.text || headings[0]?.text || "Contents";

  // Handle heading click - collapse first, then scroll
  const handleHeadingClick = useCallback(
    (id: string) => {
      setIsExpanded(false);
      // Small delay to let the collapse animation start before scrolling
      setTimeout(() => {
        onHeadingClick(id);
      }, 50);
    },
    [onHeadingClick],
  );

  // Close on escape
  useEffect(() => {
    if (!isExpanded && !toolbarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
        setToolbarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, toolbarOpen]);

  // Scroll active item into view when expanded
  useEffect(() => {
    if (isExpanded && tocListRef.current && activeHeading) {
      const activeItem = tocListRef.current.querySelector(`[data-heading-id="${activeHeading}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [isExpanded, activeHeading]);

  return (
    <AnimatePresence>
      {isVisible && (
        <BarContainer
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header row with logo */}
          <HeaderRow>
            <Link href="/" style={{ textDecoration: "none" }}>
              <LogoContainer>
                <Image src={NevuloLogo} alt="Nevulo" width={20} height={20} />
                <LogoText>nevulo</LogoText>
              </LogoContainer>
            </Link>
          </HeaderRow>

          {/* Section row */}
          <SectionRow>
            <SectionLeft
              onClick={() => {
                const newState = !isExpanded;
                setIsExpanded(newState);
                // Close toolbar when opening TOC
                if (newState) setToolbarOpen(false);
              }}
            >
              <ProgressRing progress={readProgress} />
              <SectionTextContainer>
                <AnimatePresence mode="wait" initial={false}>
                  {isExpanded ? (
                    <SectionText
                      key="title"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {articleTitle}
                    </SectionText>
                  ) : (
                    <SectionText
                      key="section"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {currentSectionText}
                    </SectionText>
                  )}
                </AnimatePresence>
              </SectionTextContainer>
              <ChevronButton aria-label={isExpanded ? "Collapse TOC" : "Expand TOC"}>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </ChevronButton>
            </SectionLeft>

            <ToolbarToggle
              onClick={() => {
                const newState = !toolbarOpen;
                setToolbarOpen(newState);
                // Close TOC when opening toolbar
                if (newState) setIsExpanded(false);
              }}
              $isOpen={toolbarOpen}
              aria-label={toolbarOpen ? "Close toolbar" : "Open toolbar"}
            >
              {toolbarOpen ? <X size={18} /> : <MoreVertical size={18} />}
            </ToolbarToggle>
          </SectionRow>

          {/* Expanded TOC list */}
          <AnimatePresence>
            {isExpanded && (
              <TOCListContainer
                ref={tocListRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <TOCList>
                  {headings.map((heading) => (
                    <TOCItemButton
                      key={heading.id}
                      data-heading-id={heading.id}
                      $level={heading.level}
                      $isActive={activeHeading === heading.id}
                      onClick={() => handleHeadingClick(heading.id)}
                    >
                      {heading.text}
                    </TOCItemButton>
                  ))}
                </TOCList>
              </TOCListContainer>
            )}
          </AnimatePresence>

          {/* Toolbar dropdown */}
          <AnimatePresence>
            {toolbarOpen && (
              <>
                <ToolbarOverlay
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setToolbarOpen(false)}
                />
                <ToolbarDropdown
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  {toolbarContent}
                </ToolbarDropdown>
              </>
            )}
          </AnimatePresence>
        </BarContainer>
      )}
    </AnimatePresence>
  );
}

// Progress ring component
function ProgressRing({ progress }: { progress: number }) {
  const size = 22;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <RingSvg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={LOUNGE_COLORS.tier1}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 0.3s ease",
        }}
      />
    </RingSvg>
  );
}

// Styled components
const BarContainer = styled(m.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(16, 13, 27, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: env(safe-area-inset-top);

  /* Only show on mobile */
  @media (min-width: 1201px) {
    display: none;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const LogoText = styled.span`
  font-family: var(--font-display);
  font-size: 14px;
  color: white;
  letter-spacing: -0.5px;
`;

const SectionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 44px;
`;

const SectionLeft = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
`;

const SectionTextContainer = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const SectionText = styled(m.span)`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-sans);
`;

const ChevronButton = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
`;

const ToolbarToggle = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: ${(props) => (props.$isOpen ? "rgba(144, 116, 242, 0.2)" : "transparent")};
  color: ${(props) => (props.$isOpen ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.7)")};
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  margin-left: 8px;

  &:hover {
    background: rgba(144, 116, 242, 0.15);
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const RingSvg = styled.svg`
  flex-shrink: 0;
`;

const TOCListContainer = styled(m.div)`
  overflow: hidden;
`;

const TOCList = styled.div`
  max-height: 60vh;
  overflow-y: auto;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  /* Custom scrollbar */
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
`;

const TOCItemButton = styled.button<{ $level: 2 | 3; $isActive: boolean }>`
  display: block;
  width: 100%;
  padding: 12px 16px;
  padding-left: ${(props) => (props.$level === 3 ? "32px" : "16px")};
  background: none;
  border: none;
  border-left: 2px solid ${(props) => (props.$isActive ? LOUNGE_COLORS.tier1 : "transparent")};
  text-align: left;
  font-size: 14px;
  font-weight: ${(props) => (props.$level === 2 ? 500 : 400)};
  color: ${(props) =>
    props.$isActive
      ? LOUNGE_COLORS.tier1
      : props.$level === 2
        ? "rgba(255, 255, 255, 0.9)"
        : "rgba(255, 255, 255, 0.6)"};
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--font-sans);
  line-height: 1.4;

  &:hover {
    background: rgba(144, 116, 242, 0.1);
    color: ${(props) => (props.$isActive ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.95)")};
  }

  &:active {
    background: rgba(144, 116, 242, 0.15);
  }
`;

const ToolbarOverlay = styled(m.div)`
  position: fixed;
  inset: 0;
  z-index: 99;
`;

const ToolbarDropdown = styled(m.div)`
  position: absolute;
  top: calc(100% + 8px);
  right: 16px;
  z-index: 101;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: rgba(16, 13, 27, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`;
