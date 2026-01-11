import { m } from "framer-motion";
import styled from "styled-components";
import { Container } from "../container";

export const Button = styled(m.button)`
  text-decoration: none;
  opacity: 0.85;
  cursor: pointer;
  background: linear-gradient(to bottom, #212121, #171717);
  padding: 0.75em 1.5em;
  font-family: var(--font-sans);
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
  padding: 0.6em 1.2em;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: clamp(1rem, 1.2rem, 1.4rem);
  margin: 0;
  border: 0;
  outline: 0;
  color: white;
  border-radius: 6px;
  transition: opacity 0.2s ease, transform 0.2s ease;
  display: inline-block;
  white-space: nowrap;

  &:hover {
    opacity: 1;
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #4f4dc1;
    outline-offset: 2px;
  }

  @media (max-width: 600px) {
    font-size: clamp(0.9rem, 1rem, 1.1rem);
    padding: 0.55em 1em;
  }

  @media (max-width: 500px) {
    font-size: clamp(0.85rem, 0.95rem, 1rem);
    padding: 0.5em 0.85em;
  }
`;

export const ButtonContainer = styled(Container)`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  margin-top: 2rem;
  gap: 1rem;

  @media (min-height: 768px) and (min-width: 768px) {
    gap: 1.25rem;
  }

  @media (max-width: 600px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  @media (max-width: 468px) {
    margin-top: 1.25rem;
    gap: 0.6rem;
  }
`;
