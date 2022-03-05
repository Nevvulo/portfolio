import { m } from "framer-motion";
import styled from "styled-components";
import { Container } from "../container";

export const Button = styled(m.button)`
  text-decoration: none;
  opacity: 0.75;
  cursor: pointer;
  background: linear-gradient(to bottom, #212121, #171717);
  padding: 0.6em min(2vw, 1.5em);
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: clamp(2vmin, 1.4rem, 6vmax);
  margin: 0.25em;
  border: 0;
  outline: 0;
  color: white;
  border-radius: 4px;
`;

export const ButtonLink = styled(m.a)`
  text-decoration: none;
  opacity: 0.75;
  cursor: pointer;
  background: linear-gradient(to bottom, #212121, #171717);
  padding: 0.6em min(2vw, 1.5em);
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: clamp(2vmin, 1.4rem, 6vmax);
  margin: 0.25em;
  border: 0;
  outline: 0;
  color: white;
  border-radius: 4px;
`;

export const ButtonContainer = styled(Container)`
  flex: 1 0 25%;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: flex-start;
  width: 100%;
  margin-top: max(4px, 2vh);

  @media (min-height: 768px) and (min-width: 568px) {
    flex-wrap: wrap;
    flex-direction: row;
    font-size: 24px;
  }

  @media (max-width: 468px) {
    margin-top: 0;
  }
`;
