import styled from "styled-components";

export const Title = styled.h1`
  font-family: "Inter", sans-serif;
  font-weight: 800;
  color: white;
  line-height: 58px;
  font-size: 68px;
  margin: 0px;
  letter-spacing: -1.5px;

  @media (max-width: 1000px) {
    font-size: 50px;
    line-height: 48px;
  }

  @media (max-width: 468px) {
    font-size: 10vw;
  }
`;
