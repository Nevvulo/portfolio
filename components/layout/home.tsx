import styled from "styled-components";
import { AnimatedMinimalView } from "./minimal";

export const HomeView = styled(AnimatedMinimalView)`
  display: flex;
  width: 100%;
  overflow: auto;

  @media (min-height: 400px) and (min-width: 450px), (min-height: 800px) {
    height: 100vh;
    justify-items: center;
  }
`;
