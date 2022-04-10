import styled from "styled-components";

interface HeroProps {
  background?: string;
  image?: string;
}

export const Hero = styled.div<HeroProps>`
  ${(props) => (props.background ? `background: ${props.background};` : "")}
  ${(props) => (props.image ? `background-image: url("${props.image}");` : "")}
  display: flex;
  align-items: center;
  padding: 0 1em;
  background-position-y: 230px;
  height: 100px;
  border-radius: 6px;
  margin: 0.5em;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  color: white;
  font-family: "Inter", sans-serif;
`;