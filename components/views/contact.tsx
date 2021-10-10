import styled from "styled-components";
import { MinimalView } from "./minimal";

export const ContactView = styled(MinimalView)`
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10%;
  border-radius: 4px;

  @media (max-width: 460px) {
    padding: 0 6px;
  }
`;
