import Image, { ImageProps } from "next/image";
import { useState } from "react";
import styled from "styled-components";

export function SkeletonImage({
  ...props
}: Omit<ImageProps, "onLoadingComplete">) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSkeleton, setIsSkeleton] = useState(true);

  return (
    <PostImageContainer
      className={isLoaded ? "fade" : ""}
      data-loaded={isLoaded}
      /* remove skeleton after transition ends */
      onTransitionEnd={(event) =>
        event.propertyName === "opacity" && setIsSkeleton(false)
      }
    >
      <SkeletonContainer className={isSkeleton ? "skeleton" : ""}>
        <PostImage
          quality={90}
          {...props}
          onLoadingComplete={() => setIsLoaded(true)}
        />
      </SkeletonContainer>
    </PostImageContainer>
  );
}

const SkeletonContainer = styled.div`
  position: relative;
  overflow: hidden;

  @keyframes shimmer {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
  }

  &.skeleton {
    border-radius: 6px;
    background: ${(props) => props.theme.postImageLoadingBackground};

    &::before {
      position: absolute;
      content: "";
      inset: 0;
      background-image: linear-gradient(
        90deg,
        rgba(${(props) => props.theme.postImageLoadingBackgroundShimmerRgb}, 0)
          0,
        rgba(
            ${(props) => props.theme.postImageLoadingBackgroundShimmerRgb},
            0.2
          )
          20%,
        rgba(
            ${(props) => props.theme.postImageLoadingBackgroundShimmerRgb},
            0.5
          )
          60%,
        rgba(${(props) => props.theme.postImageLoadingBackgroundShimmerRgb}, 0)
      );
      animation: shimmer 3s infinite;
    }
  }

  margin: 1em;

  @media (min-width: 460px) {
    width: 150px;
    height: 150px;
  }

  @media (max-width: 460px) {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0;

    &.skeleton {
      border-radius: 10px;
      border-end-end-radius: 0px;
      border-end-start-radius: 0px;
    }

    > div {
      display: contents !important;
    }
  }
`;

const PostImageContainer = styled.div`
  position: relative;
  max-height: 150px;
  position: relative;

  &.fade {
    transition: opacity 200ms ease;
    opacity: 0;
  }

  &[data-loaded="true"] {
    opacity: 1;
  }
`;

const PostImage = styled(Image)`
  border-radius: 6px;
  border: 0.1px solid ${(props) => props.theme.postImageBoxShadow};
  box-shadow: 0px 0px 8px 1px ${(props) => props.theme.postImageBoxShadow};

  @media (max-width: 460px) {
    border-radius: 10px;
    border-end-end-radius: 0px;
    border-end-start-radius: 0px;
  }
`;
