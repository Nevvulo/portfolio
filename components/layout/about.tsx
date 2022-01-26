import styled from "styled-components";
import { MinimalView } from "./minimal";

export const AboutBox = styled(MinimalView)`
  display: flex;
  align-items: flex-start;
  border-radius: 4px;
  max-width: 650px;
  padding: 1em;

  @media (max-width: 460px) {
    margin: 1em 5%;
  }
`;
