import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { api } from "../../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../../constants/theme";

/** Hero carousel for admin-configured featured content */
export function FeaturedCarousel() {
  const items = useQuery(api.featuredContent.getBySlot, { slot: "hero" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const slideCount = items?.length ?? 0;

  useEffect(() => {
    if (slideCount <= 1 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, 6000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [slideCount, isPaused]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];
  const isExternal = current.linkUrl.startsWith("http");

  return (
    <Container
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Slide style={{ background: current.background || "linear-gradient(135deg, rgba(144,116,242,0.2), rgba(144,116,242,0.05))" }}>
        {current.imageUrl && <SlideImg src={current.imageUrl} alt={current.title} />}
        <SlideOverlay />
        <SlideContent>
          <SlideTitle>{current.title}</SlideTitle>
          {current.subtitle && <SlideSubtitle>{current.subtitle}</SlideSubtitle>}
          {current.description && <SlideDescription>{current.description}</SlideDescription>}
          <SlideCTA
            href={current.linkUrl}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
            {isExternal ? (<>Learn more <ExternalLink size={14} /></>) : "Check it out"}
          </SlideCTA>
        </SlideContent>
      </Slide>

      {slideCount > 1 && (
        <>
          <NavBtn $side="left" onClick={goPrev}><ChevronLeft size={20} /></NavBtn>
          <NavBtn $side="right" onClick={goNext}><ChevronRight size={20} /></NavBtn>
          <Dots>
            {items.map((item, i) => (
              <Dot key={item._id} $active={i === currentIndex} onClick={() => goTo(i)} />
            ))}
          </Dots>
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  margin: 0 48px;
  @media (max-width: 900px) { margin: 0 16px; }
`;

const Slide = styled.div`
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: flex-end;
  @media (max-width: 600px) { min-height: 160px; }
`;

const SlideImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SlideOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
`;

const SlideContent = styled.div`
  position: relative;
  padding: 24px 28px;
  z-index: 1;
  width: 100%;
  @media (max-width: 600px) { padding: 16px 20px; }
`;

const SlideTitle = styled.h3`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  @media (max-width: 600px) { font-size: 18px; }
`;

const SlideSubtitle = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
`;

const SlideDescription = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  max-width: 500px;
  line-height: 1.4;
`;

const SlideCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 16px;
  background: ${LOUNGE_COLORS.tier1};
  color: white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  &:hover { opacity: 0.9; transform: translateY(-1px); }
`;

const NavBtn = styled.button<{ $side: "left" | "right" }>`
  position: absolute;
  top: 50%;
  ${(p) => (p.$side === "left" ? "left: 12px;" : "right: 12px;")}
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  color: white;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 2;
  ${Container}:hover & { opacity: 1; }
  &:hover { background: rgba(0,0,0,0.7); }
`;

const Dots = styled.div`
  position: absolute;
  bottom: 10px;
  right: 16px;
  display: flex;
  gap: 6px;
  z-index: 2;
`;

const Dot = styled.button<{ $active?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  background: ${(p) => (p.$active ? "white" : "rgba(255,255,255,0.4)")};
  transition: all 0.2s ease;
  &:hover { background: rgba(255,255,255,0.7); }
`;
