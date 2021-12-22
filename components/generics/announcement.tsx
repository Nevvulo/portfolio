import styled from "styled-components";
import { Container } from "../container";

export const Announcement = styled(Container)`
  background: rgba(255, 208, 115, 0.3);
  padding: 0em 1em;
  width: 85%;
  max-width: 600px;
  text-align: center;
  position: absolute;
  color: rgba(255, 230, 140) !important;
  top: 0;
  margin-top: 1em;
  border: 0.25px solid rgba(25, 25, 25, 0.25);
  border-radius: 8px;
  color: white;
  font-family: "Inter", sans-serif;
  letter-spacing: -0.5px;

  svg {
    margin-top: 2px;
    color: rgb(220, 220, 200);
  }

  a {
    color: rgba(230, 190, 34) !important;
    font-weight: 700;
    font-family: "Fira Code", monospace;
  }
`;
