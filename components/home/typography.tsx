import styled from "styled-components";

export const Title = styled.h1`
  display: block;
  color: ${(props) => props.theme.contrast};
  font-family: "Work Sans";
  font-weight: 900;
  line-height: clamp(32px, 6vmax, 72px);
  font-size: clamp(32px, 6vmax, 72px);
  margin-bottom: 0px;
  margin-top: 0px;
  letter-spacing: -1.5px;
`;

export const Subtitle = styled.h2`
  font-family: "Inter", sans-serif;
  letter-spacing: -0.2px;
  color: ${(props) => props.theme.textColor};
  font-weight: 400;
  font-size: max(16px, 2.5vh);
  margin-top: max(4px, 2vh);
`;
