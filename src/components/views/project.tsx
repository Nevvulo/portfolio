import styled from "styled-components";
import { MinimalView } from "./minimal";

export const ProjectView = styled(MinimalView)`
  align-self: center;
  height: 100%;
  width: 100%;
  padding-top: 5%;

  @media (max-width: 768px) {
    padding: 1em min(10%, 12px);
  }
`;
