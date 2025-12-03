import { m } from "framer-motion";
import styled from "styled-components";
import { Container } from "../container";

export const Button = styled(m.button)`
  text-decoration: none;
  opacity: 0.85;
  cursor: pointer;
  background: linear-gradient(to bottom, #212121, #171717);
  padding: 0.75em 1.5em;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: clamp(1rem, 1.4rem, 2rem);
  margin: 0;
  border: 0;
  outline: 0;
  color: white;
  border-radius: 6px;
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 1;
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #4f4dc1;
    outline-offset: 2px;
  }
`;

export const ButtonLink = styled.a`
  text-decoration: none;
  opacity: 0.85;
  cursor: pointer;
  background: linear-gradient(to bottom, #212121, #171717);
  padding: 0.75em 1.5em;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: clamp(1rem, 1.4rem, 2rem);
  margin: 0;
  border: 0;
  outline: 0;
  color: white;
  border-radius: 6px;
  transition: opacity 0.2s ease, transform 0.2s ease;
  display: inline-block;

  &:hover {
    opacity: 1;
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #4f4dc1;
    outline-offset: 2px;
  }

  @media (max-width: 600px) {
    font-size: clamp(0.9rem, 1.1rem, 1.3rem);
    width: calc(50% - 0.5rem);
    text-align: center;
    flex: 0 0 calc(50% - 0.5rem);
    padding: 0.7em 1em;
  }

  @media (max-width: 500px) {
    font-size: clamp(0.85rem, 1rem, 1.2rem);
    padding: 0.65em 0.9em;
  }
`;

export const ButtonContainer = styled(Container)`
  flex: 1 0 25%;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: flex-start;
  width: 100%;
  margin-top: 1.5rem;
  gap: 1rem;

  @media (min-height: 768px) and (min-width: 568px) {
    flex-wrap: wrap;
    flex-direction: row;
    font-size: 24px;
  }

  @media (max-width: 600px) {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-between;
    margin-top: 1.25rem;
  }

  @media (max-width: 468px) {
    margin-top: 1rem;
    gap: 0.75rem;
  }
`;
