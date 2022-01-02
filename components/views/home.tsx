import styled from "styled-components";
import { MinimalView } from "./minimal";

export const HomeView = styled(MinimalView)`
  overflow: hidden;
  display: flex;
  justify-items: center;
  width: 100%;
  height: 100%;

  :before {
    background-image: url("/background.png");
    content: " ";
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.2;
  }
`;
