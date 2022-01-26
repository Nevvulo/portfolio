import styled from "styled-components";

interface SkeletonProps {
  height?: number;
  marginBottom?: number;
  marginTop?: number;
}
export const Skeleton = styled.div<SkeletonProps>`
  background: rgba(80, 80, 90, 0.4);
  color: transparent;
  position: relative;
  overflow: hidden;
  height: ${(props) => props.height}px;
  margin-top: ${(props) => props.marginTop}px;
  margin-bottom: ${(props) => props.marginBottom}px;

  ::before {
    content: "";
    position: absolute;
    left: 0%;
    top: 0;
    height: 100%;
    width: 90px;
    background: linear-gradient(
      to right,
      #575757 25%,
      #696969 50%,
      #7d7d7d 100%
    );
    animation-name: gradient-animation;
    animation-duration: 2s;
    animation-iteration-count: infinite;
    filter: blur(3px);
  }

  @keyframes gradient-animation {
    from {
      left: -25%;
    }
    to {
      left: 105%;
    }
  }
`;
