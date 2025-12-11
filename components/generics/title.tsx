import { m } from "framer-motion";
import styled from "styled-components";

export const Title = styled(m.h1)<{
  fontSize?: string | number;
  padding?: string;
  color?: string;
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-family: "Inter", sans-serif;
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
