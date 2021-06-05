import styled from "styled-components";

interface PageProps {
  background?: string;
}

export const Page = styled.div<PageProps>`
  background: ${(props) => props.background || "black"};
  width: 80ch;
  border-radius: 24px;
  box-shadow: inset 0px -20px 0px 0px rgb(20 20 20 / 50%),
    10px 10px 15px rgba(0, 0, 0, 0.35);
  padding: 1em 3em 0.25em 3em;

  @media (max-width: 468px) {
    padding: 0.5em 1.5em 0.125em 1.5em;
    padding-bottom: 2em;
  }
  overflow: auto;
`;
