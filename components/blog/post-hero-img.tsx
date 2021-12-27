import { PropsWithChildren } from "react";
import styled from "styled-components";

const PostHeroImgContainer = styled.div<{ img?: any }>`
  display: flex;
  height: 100%;
  width: 100%;

  margin-top: 24px;
  margin-bottom: 12px;

  transition: border 0.3s;
  align-items: center;
  border: 2.5px solid #212121;
  max-height: 300px;
  border-radius: 8px;
  background: #131313;

  object-fit: contain;
  background-image: linear-gradient(
      249deg,
      rgba(163, 108, 228, 0.46682422969187676) 0%,
      rgba(36, 18, 50, 0.9626225490196079) 50%,
      rgba(24, 24, 24, 0.9626225490196079) 99%
    ),
    url("${(props) => props.img}");
  background-size: cover;

  padding-top: 24px;
  padding-bottom: 24px;

  @media (max-width: 675px) {
    border-radius: 0px;
  }
`;

export function PostHeroImg(props: PropsWithChildren<any>) {
  return (
    <PostHeroImgContainer img={props.src}>
      {props.children}
    </PostHeroImgContainer>
  );
}
