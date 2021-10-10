import styled from "styled-components";
import { AnimatedButton } from "../generics/button";

export const ProjectButton = styled(AnimatedButton)`
  position: relative;
  width: auto;
  background: black;
  opacity: 0.75;
  cursor: pointer;
  padding: 0.5em;
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 16px;
  margin: 0.25em;
  border: 0;
  outline: 0;
  color: white;
  border-radius: 6px;
  text-decoration: none;
  text-transform: uppercase;
  z-index: 1;
`;
