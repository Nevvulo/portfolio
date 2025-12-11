import styled from "styled-components";

export const PostHeader = styled.div`
  border-radius: 8px;
  color: white;
  width: 100%;
  max-width: 100%;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: clamp(12px, 5vw, 48px);
  padding-right: clamp(12px, 5vw, 48px);

  h1 {
    margin-top: 0;
    margin-bottom: 2px;
    font-size: clamp(28px, 5vw, 42px);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 700;
    letter-spacing: -0.5px;
    line-height: 1.2;
    max-width: 100%;
    width: 100%;
  }

  h3 {
    font-size: 16px;
    color: #b5b5b5;
    font-family: "Roboto", sans-serif;
    letter-spacing: 0px;
    font-weight: 400;
    margin-top: 0.2em;
    max-width: 100%;
  }

  @media (min-width: 676px) {
    border-radius: 0px;
    border: 0px solid #212121;
    padding-left: 6vw;
    padding-right: 6vw;

    h1 {
      font-size: clamp(36px, 4.5vw, 52px);
    }
  }

  @media (min-width: 1024px) {
    padding-left: 10%;
    padding-right: 10%;

    h1 {
      font-size: clamp(42px, 4vw, 58px);
      letter-spacing: -1px;
    }
  }

  @media (min-width: 1400px) {
    padding-left: 8%;
    padding-right: 8%;

    h1 {
      font-size: clamp(48px, 3.5vw, 64px);
    }
  }
`;
