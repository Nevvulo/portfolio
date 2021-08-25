import styled from "styled-components";

export const Title = styled.h1<{
  fontSize?: string | number;
  padding?: string;
  color?: string;
}>`
  font-family: "Cousine", sans-serif;
  font-weight: 900;
  color: ${(props) => props.color};
  font-size: ${(props) => props.fontSize ?? "42px"};
  padding: ${(props) => props.padding ?? "0px"};
  margin: 0px;
  letter-spacing: -1.25px;
`;
