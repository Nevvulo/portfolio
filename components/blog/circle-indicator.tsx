import { m, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import styled from "styled-components";

interface Props {
  onComplete?: () => void;
}
export const CircleIndicator = ({ onComplete }: Props) => {
  const [isComplete, setIsComplete] = useState(false);
  const scrollProgress = useMotionValue(0);
  const yRange = useTransform(scrollProgress, [0, 0.95], [0, 1]);
  const pathLength = useSpring(yRange, { stiffness: 400, damping: 90 });

  useEffect(() => {
    const calculateProgress = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
      scrollProgress.set(progress);
    };

    calculateProgress();
    window.addEventListener("scroll", calculateProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", calculateProgress);
    };
  }, [scrollProgress]);

  useEffect(() => {
    const unsubscribe = yRange.on("change", (v) => setIsComplete(v >= 1));
    return unsubscribe;
  }, [yRange]);

  useEffect(() => {
    if (!isComplete) return;
    onComplete?.();
  }, [isComplete, onComplete]);

  return (
    <Container>
      <m.path
        fill="none"
        strokeWidth="5"
        stroke="white"
        strokeDasharray="0 1"
        d="M 0, 20 a 20, 20 0 1,0 40,0 a 20, 20 0 1,0 -40,0"
        style={{
          pathLength,
          rotate: 90,
          translateX: 5,
          translateY: 5,
          scaleX: -1,
        }}
      />
      <m.path
        fill="none"
        strokeWidth="5"
        stroke="white"
        d="M14,26 L 22,33 L 35,16"
        initial={false}
        strokeDasharray="0 1"
        animate={{ pathLength: isComplete ? 1 : 0 }}
      />
    </Container>
  );
};

const Container = styled(m.svg).attrs({ viewBox: "0 -1 50 54" })`
  z-index: 100;
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: rgba(0, 0, 0, 0.75);
  padding: 0.25em;
  border-radius: 8px;
  width: 40px;
  height: 40px;
`;
