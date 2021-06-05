import { motion } from "framer-motion";
import { HTMLAttributes } from "react";
import styled from "styled-components";

type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";

export interface ContainerProps {
  className?: any;
  flex?: string;
  direction?: FlexDirection;
  background?: string;
  borderRadius?: any;
  alignItems?: string;
}

const StyledContainer = styled.div<
  ContainerProps & HTMLAttributes<HTMLDivElement>
>`
  display: flex;
  flex: ${(props) => props.flex};
  flex-direction: ${(props) => props.direction};
  background: ${(props) => props.background || "none"};
  border-radius: ${(props) => props.borderRadius || "0px"};
  align-items: ${(props) => props.alignItems || "initial"};
`;

export const AnimatedContainer = styled(motion.div)<ContainerProps>`
  display: flex;
  flex: ${(props) => props.flex};
  flex-direction: ${(props) => props.direction};
  background: ${(props) => props.background || "none"};
`;

export const FadeAnimatedContainer = styled(AnimatedContainer).attrs({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15 } },
  transition: { duration: 0.2, delay: 0.15 },
})``;

export const BlockContainer = styled.div`
  display: block;
`;

export { StyledContainer as Container };
