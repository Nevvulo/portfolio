import type { PropsWithChildren, CSSProperties } from "react";
import styled from "styled-components";
import { m, type MotionStyle } from "framer-motion";

// Base opacity values at 100% intensity
const GRADIENT_BASE = {
  start: 1,      // rgba(144, 116, 242, X)
  middle: 0.88,  // rgb(38 23 90 / X%)
  end: 0.96,     // rgb(61 38 38 / X%)
};

const PostHeroImgContainer = styled(m.div)<{ $img?: string; $intensity: number }>`
  display: flex;
  position: relative;
  min-height: 320px;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);

  margin-top: 1rem;
  margin-bottom: 12px;

  transition: border 0.3s;
  align-items: center;
  justify-content: flex-start;
  border: 2.5px solid #212121;
  background: #131313;

  object-fit: contain;
  background-image: linear-gradient(
      249deg,
      rgba(144, 116, 242, ${(props) => GRADIENT_BASE.start * props.$intensity}) 0%,
      rgb(38 23 90 / ${(props) => GRADIENT_BASE.middle * props.$intensity * 100}%) 50%,
      rgb(61 38 38 / ${(props) => GRADIENT_BASE.end * props.$intensity * 100}%) 98%
    ),
    url("${(props) => props.$img}");
  background-size: cover;
  background-position: center;

  padding-top: 48px;
  padding-bottom: 24px;

  @media (max-width: 675px) {
    border-radius: 0px;
    min-height: 260px;
  }

  @media (min-width: 676px) {
    min-height: 360px;
  }

  @media (min-width: 1024px) {
    min-height: 400px;
  }
`;

const CoverAuthorContainer = styled.div`
  position: absolute;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.4);
  bottom: 0;
  right: 0;
  font-family: "Inter", system-ui, sans-serif;
  padding: 0.4em;
`;

const CoverAuthor = styled.a`
  color: rgb(225, 225, 225);
  text-decoration: underline;
`;

type PostHeroImgProps = {
  src: string;
  coverAuthor?: string;
  coverAuthorUrl?: string;
  gradientIntensity?: number; // 0-100, defaults to 100
  style?: MotionStyle;
};
export function PostHeroImg(props: PropsWithChildren<PostHeroImgProps>) {
  // Convert 0-100 to 0-1, default to 100% intensity
  const intensity = (props.gradientIntensity ?? 100) / 100;

  return (
    <PostHeroImgContainer $img={props.src} $intensity={intensity} style={props.style}>
      {props.children}
      {props.coverAuthor && (
        <CoverAuthorContainer>
          <CoverAuthor href={props.coverAuthorUrl}>Cover image by {props.coverAuthor}</CoverAuthor>
        </CoverAuthorContainer>
      )}
    </PostHeroImgContainer>
  );
}
