import { Link as LinkComponent } from "react-router-dom";
import styled from "styled-components";

export const Link = styled(LinkComponent)`
  color: white;
`;

export const StrippedLink = styled(LinkComponent)`
  text-decoration: none;
`;
