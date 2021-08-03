import styled from "styled-components";

export const Title = styled.h1<{
  fontSize?: string | number;
  padding?: string;
}>`
  font-family: "Inter", sans-serif;
  font-weight: 700;
  color: black;
  font-size: ${(props) => props.fontSize ?? "42px"};
  padding: ${(props) => props.padding ?? "0px"};
  margin: 0px;
  letter-spacing: -1.5px;
`;
