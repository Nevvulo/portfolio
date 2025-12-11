import { m } from "framer-motion";
import styled, { keyframes } from "styled-components";
import { riseUp, riseUpBounce } from "../../utils/animation";

export const FadeUp = styled(m.span)<{ $delay: number; $bounce?: boolean }>`
  display: inline-block;
  animation: 0.8s ${(props) => (!props.$bounce ? riseUp : riseUpBounce)} forwards;
  opacity: 0;
  transform: translateY(20px);
  animation-timing-function: cubic-bezier(0.33, 0.71, 0.58, 0.99);
  animation-delay: ${(props) => props.$delay || "0"}ms;

  @media (prefers-reduced-motion) {
    animation: none;
    opacity: 1;
    transform: translateY(0px);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const FadeIn = styled(m.span)<{ $delay: number }>`
  display: inline-block;
  animation: 0.6s ${fadeIn} forwards;
  opacity: 0;
  animation-timing-function: ease-out;
  animation-delay: ${(props) => props.$delay || "0"}ms;

  @media (prefers-reduced-motion) {
    animation: none;
    opacity: 1;
  }
`;
