import styled from "styled-components";
import { AnimatedContainer, Container } from "../container";

export const AnimatedMinimalView = styled(AnimatedContainer)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
`;

export const MinimalView = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
  min-height: 100vh;
  width: 100%;
`;
