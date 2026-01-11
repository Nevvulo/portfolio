import { m } from "framer-motion";
import styled from "styled-components";

/**
 * Section title using Fira Code (--font-mono)
 * Consistent with blog post markdown headers
 */
export const SectionTitle = styled.h2<{
  $centered?: boolean;
}>`
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 1.5em;
  letter-spacing: -1.25px;
  color: ${(props) => props.theme.contrast};
  text-align: ${(props) => (props.$centered ? "center" : "left")};
  margin: 0 0 1.5rem 0;

  @media (max-width: 768px) {
    font-size: 1.25em;
    letter-spacing: -0.75px;
  }

  @media (max-width: 480px) {
    font-size: 1.1em;
    letter-spacing: -0.5px;
  }
`;

export const Title = styled(m.h1)<{
  fontSize?: string | number;
  padding?: string;
  color?: string;
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-family: var(--font-sans);
  font-weight: 900;
  color: ${(props) => props.theme.contrast};
  font-size: ${(props) => props.fontSize ?? "42px"};
  padding: ${(props) => props.padding ?? "0px"};
  margin: 0px;
  letter-spacing: -1.25px;
  line-height: 1.2;

  > * {
    margin-right: 12px;
  }
`;
