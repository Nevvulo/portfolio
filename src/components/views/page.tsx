import styled from "styled-components";
interface PageProps {
  background?: string;
}

export const Page = styled.div<PageProps>`
  background: ${(props) => props.background};
  overflow: auto;
  max-width: 650px;
  width: 100%;
  height: 100%;

  @media (max-width: 468px) {
    padding-bottom: 2em;
  }
`;
