import styled from "styled-components";

export const Text = styled.p<{ fontSize?: string }>`
  font-family: "RobotoCondensed", sans-serif;
  font-weight: 400;
  color: ${(props) => props.color ?? "white"} !important;
  font-size: ${(props) => props.fontSize ?? "20px"};
  margin: 1em 4px;
  max-height: 65%;
  color: rgb(225, 225, 225);

  @media (max-width: 468px) {
    font-size: 17px;
  }
`;
