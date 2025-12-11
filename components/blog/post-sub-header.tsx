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
    flex-wrap: nowrap;
    color: #c4c4c4;
    font-family: ui-serif, Georgia, Cambria, Times New Roman, Times, serif;
    margin: 0.5em 0.5em 0.25em 0;
  }

  strong {
    color: #eeeeee;
    font-family: "Inter", sans-serif;
    letter-spacing: -0.2px;
  }
`;
