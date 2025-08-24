import { m, type HTMLMotionProps } from "framer-motion";
import type React from "react";
import type { HTMLAttributes } from "react";
import styled from "styled-components";

type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";

export interface ContainerProps {
  className?: string;
  flex?: string;
  direction?: FlexDirection;
  background?: string;
  borderRadius?: string | number;
  alignSelf?: string;
  justifyContent?: string;
  alignItems?: string;
  padding?: string;
  layoutId?: string;
}

interface StyledContainerProps {
  $flex?: string;
  $direction?: FlexDirection;
  $background?: string;
  $borderRadius?: string | number;
  $alignSelf?: string;
  $justifyContent?: string;
  $alignItems?: string;
  $padding?: string;
}

const StyledContainer = styled.div<StyledContainerProps & HTMLAttributes<HTMLDivElement>>`
  display: flex;
  flex: ${(props) => props.$flex};
  flex-direction: ${(props) => props.$direction};
  background: ${(props) => props.$background || "none"};
  padding: ${(props) => props.$padding || "0px"};
  border-radius: ${(props) => props.$borderRadius || "0px"};
  align-items: ${(props) => props.$alignItems || "initial"};
  justify-content: ${(props) => props.$justifyContent || "initial"};
  align-self: ${(props) => props.$alignSelf || "initial"};
`;

const AnimatedContainerStyled = styled(m.div)<StyledContainerProps>`
  display: flex;
  flex: ${(props) => props.$flex};
  flex-direction: ${(props) => props.$direction};
  background: ${(props) => props.$background || "none"};
`;

const FadeAnimatedContainerStyled = styled(AnimatedContainerStyled).attrs({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15 } },
  transition: { duration: 0.2, delay: 0.15 },
})`
  width: 100%;
`;

export const FadeAnimatedContainer: React.FC<ContainerProps & Partial<HTMLMotionProps<"div">>> = ({
  flex,
  direction,
  background,
  borderRadius,
  alignSelf,
  justifyContent,
  alignItems,
  padding,
  layoutId,
  ...props
}) => (
  <FadeAnimatedContainerStyled
    $flex={flex}
    $direction={direction}
    $background={background}
    $borderRadius={borderRadius}
    $alignSelf={alignSelf}
    $justifyContent={justifyContent}
    $alignItems={alignItems}
    $padding={padding}
    layoutId={layoutId}
    {...(props as any)}
  />
);

export const BlockContainer = styled.div`
  display: block;
`;

// Wrapper components that convert props to transient props
export const Container: React.FC<ContainerProps & HTMLAttributes<HTMLDivElement>> = ({
  flex,
  direction,
  background,
  borderRadius,
  alignSelf,
  justifyContent,
  alignItems,
  padding,
  ...props
}) => (
  <StyledContainer
    $flex={flex}
    $direction={direction}
    $background={background}
    $borderRadius={borderRadius}
    $alignSelf={alignSelf}
    $justifyContent={justifyContent}
    $alignItems={alignItems}
    $padding={padding}
    {...props}
  />
);

export const AnimatedContainer: React.FC<ContainerProps & Partial<HTMLMotionProps<"div">>> = ({
  flex,
  direction,
  background,
  borderRadius,
  alignSelf,
  justifyContent,
  alignItems,
  padding,
  layoutId,
  ...props
}) => (
  <AnimatedContainerStyled
    $flex={flex}
    $direction={direction}
    $background={background}
    $borderRadius={borderRadius}
    $alignSelf={alignSelf}
    $justifyContent={justifyContent}
    $alignItems={alignItems}
    $padding={padding}
    layoutId={layoutId}
    {...(props as any)}
  />
);
