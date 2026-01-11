import styled from "styled-components";
import { TopNavView } from "./topnav";

export const BlogView = styled(TopNavView)`
  display: flex;
  position: relative;
  padding: 0;

  & header {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
`;
