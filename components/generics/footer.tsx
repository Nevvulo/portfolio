import styled from "styled-components";
import { Container } from "../container";

export const Footer = styled(Container)`
  background: ${(props) => props.theme.postBackground};
  padding: 0.65em;
  margin: 1em;
  border: 0.25px solid rgba(50, 25, 50, 0.5);
  border-radius: 8px;
  color: ${(props) => props.theme.pure};
  font-family: var(--font-sans);
  letter-spacing: -0.5px;
`;
