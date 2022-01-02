import styled from "styled-components";

export const Text = styled.p<{ fontSize?: string; linkColor?: string }>`
  font-family: "RobotoCondensed", sans-serif;
  font-weight: 400;
  color: ${(props) => props.color ?? "white"};
  font-size: ${(props) => props.fontSize ?? "20px"};
  margin: 1em 4px;
  max-height: 65%;
  color: rgb(225, 225, 225);

  a {
    color: ${(props) => props.linkColor || props.theme.linkColor};
    font-family: "Fira Code", monospace;
    font-weight: 700;
  }

  @media (max-width: 468px) {
    font-size: 17px;
  }
`;
