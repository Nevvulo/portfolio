import styled from "styled-components";
import { MinimalView } from "./minimal";

export const AboutBox = styled(MinimalView)`
  display: flex;
  align-items: center;
  border-radius: 4px;
  max-width: 650px;
  padding: 1em;
  margin: 0 auto;

  @media (max-width: 460px) {
    margin: 1em auto;
    width: 90%;
  }
`;
