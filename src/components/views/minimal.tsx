import styled from "styled-components";
import { Container } from "../container";

export const MinimalView = styled(Container)`
  display: flex;
  justify-content: center;
  padding: 18vh 15%;
  height: max(300px, 65vh);
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 15vh 8%;
  }
`;
