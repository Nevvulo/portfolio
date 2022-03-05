import { domMax } from "framer-motion";
import { keyframes } from "styled-components";

export const riseUp = keyframes`
from {
  opacity: 0;
  transform: translateY(40px);
}
to {
  opacity: 1;
  transform: translateY(0px);
}
`;

export const riseUpSmall = keyframes`
from {
  opacity: 0;
  transform: translateY(15px);
}
to {
  opacity: 1;
  transform: translateY(0px);
}
`;

export const riseUpBounce = keyframes`
0% {
  opacity: 0.1;
  transform: scale(3);
}
100% {
  opacity: 1;
  transform: scale(1);
  transform-origin: 25px;
}
`;

export const fadeIn = keyframes`
0% {
  opacity: 0.75;
  box-shadow: inset 0px -20px 0px 0px rgb(20 20 20 / 50%), 30px 30px 100px black;
  transform: scale(0.85) rotate(${Math.random() * 3}deg);
}
100% {
  opacity: 1;
  box-shadow: inset 0px -20px 0px 0px rgb(20 20 20 / 50%), 10px 10px 20px rgba(0, 0, 0, 0.5);
  transform: scale(1) rotate(0deg);
}
`;

export const animationFeatures = domMax;
