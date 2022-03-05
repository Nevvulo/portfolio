import { m, MotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import styled from "styled-components";

interface Props {
  scrollYProgress: MotionValue<number>;
  onComplete?: () => void;
}
export const CircleIndicator = ({ scrollYProgress, onComplete }: Props) => {
  const [isComplete, setIsComplete] = useState(false);
  const yRange = useTransform(scrollYProgress, [0, 0.95], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0.05, 0.1], [0, 1]);
  const pathLength = useSpring(yRange, { stiffness: 400, damping: 90 });

  useEffect(() => yRange.onChange((v) => setIsComplete(v >= 1)), [yRange]);

  useEffect(() => {
    if (!isComplete) return;
    onComplete?.();
    setTimeout(() => {
      opacity.stop();
      opacity.set(0);
      opacity.clearListeners();
    }, 1e3);
  }, [isComplete]);

  return (
    <Container style={{ opacity }}>
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
          scaleX: -1, // Reverse direction of line animation
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
  z-index: 3;
  position: sticky;
  background: rgba(0, 0, 0, 0.75);
  padding: 0.25em;
  transition: 0.1s opacity;
  border-radius: 8px;

  width: 32px;
  height: 32px;

  @media (min-width: 850px) {
    top: 12px;
    left: 12px;
  }

  @media (max-width: 850px) {
    top: calc(100vh - 56px);
    left: calc(100vw - 56px);
  }
`;
