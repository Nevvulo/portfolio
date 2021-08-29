import { Link as LinkComponent } from "react-router-dom";
import styled from "styled-components";

export const Link = styled(LinkComponent)`
  color: white;
  font-family: "Inter", sans-serif;
`;

export const StrippedLink = styled(LinkComponent)`
  text-decoration: none;
`;
