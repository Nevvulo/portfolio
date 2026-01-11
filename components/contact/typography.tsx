import styled from "styled-components";

export const Subtitle = styled.h2`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-family: var(--font-sans);
  font-weight: 600;
  color: ${(props) => props.color};
  font-size: 22px;
  padding: 0px;
  letter-spacing: -1.25px;
  margin: 0;
  margin-top: 8px;
`;

export const Notice = styled.p`
  font-family: var(--font-sans);
  font-weight: 400;
  color: #eeeeee;
  font-size: 16px;
  padding: 0px;
  margin: 0px;
`;
