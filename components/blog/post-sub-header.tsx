import styled from "styled-components";

export const PostSubheader = styled.div`
  color: white;
  display: flex;
  justify-items: center;

  > div {
    margin-left: 8px;
  }

  p {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    color: #c4c4c4;
    font-family: ui-serif, Georgia, Cambria, Times New Roman, Times, serif;
    font-size: 16px;
    margin: 0.5em 0.5em 0.25em 0;
    line-height: 1.5;
  }

  strong {
    color: #eeeeee;
    font-family: var(--font-sans);
    letter-spacing: -0.2px;
  }
`;
