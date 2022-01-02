import styled from "styled-components";
import { Container } from "../container";

export const Header = styled(Container)`
  margin: 1em;
  margin-top: 3em;
  padding-left: 2em;
  display: flex;
  width: 100%;
  height: 100%;
  z-index: 1;
  align-items: flex-start;

  @media (min-width: 768px) {
    padding-left: 20%;
  }
`;
