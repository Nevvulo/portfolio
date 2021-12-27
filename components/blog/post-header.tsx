import styled from "styled-components";

export const PostHeader = styled.div`
  border-radius: 8px;
  color: white;
  width: 100%;
  max-width: max(40%, 300px);
  padding-left: clamp(12px, 5vw, 20%);

  h1 {
    margin-top: 0;
    margin-bottom: 2px;
    font-size: 38px;
    font-family: "Inter", sans-serif;
    letter-spacing: -1.5px;
  }

  h3 {
    font-size: 16px;
    color: grey;
    font-family: "Roboto", sans-serif;
    letter-spacing: 0px;
    font-weight: 500;
    margin-top: 0.2em;
  }

  @media (min-width: 675px) {
    border-radius: 0px;
    border: 0px solid #212121;
    padding-left: 10vw;
  }

  @media (min-width: 1024px) {
    padding-left: 20%;

    h1 {
      font-size: 48px;
    }
  }
`;
