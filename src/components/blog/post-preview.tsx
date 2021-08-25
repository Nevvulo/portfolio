import React from "react";
import styled from "styled-components";
import { Gradients } from "../../constants/colors";
import { Container } from "../container";
import { StrippedLink } from "../generics/link";
import { Title } from "../generics/title";
import { Skeleton } from "../skeleton";

//https://codepen.io/taylorvowell/pen/BkxbC
const Post = styled.div`
  display: flex;
  flex-direction: row;
  background: #282537;
  background-image: -webkit-radial-gradient(
    top,
    circle cover,
    #3c3b52 0%,
    #252233 80%
  );
  background-image: -moz-radial-gradient(
    top,
    circle cover,
    #3c3b52 0%,
    #252233 80%
  );
  background-image: -o-radial-gradient(
    top,
    circle cover,
    #3c3b52 0%,
    #252233 80%
  );
  background-image: radial-gradient(top, circle cover, #3c3b52 0%, #252233 80%);
  border-radius: 22px;
  box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.3);
  align-self: center;
  justify-self: center;
  text-decoration: none;
  max-width: 650px;

  @media (max-width: 460px) {
    flex-direction: column;
  }
`;

const PostImage = styled.img`
  width: 150px;
  height: auto;
  border-radius: 12px 0 0 12px;
  background: grey;
  border: 0;

  @media (max-width: 460px) {
    width: 100%;
    height: 150px;
    border-radius: 12px 12px 0 0;
  }
`;

const PreviewText = styled(Container)`
  margin: 12px 24px 0px 24px;
  max-width: 450px;

  @media (min-width: 460px) {
    width: 100%;
  }
`;

const PreviewDescription = styled.p`
  font-size: 14px;
  font-weight: 400;
  font-family: "Inter", sans-serif;
  color: rgb(220, 220, 220);
`;

const PreviewContainer = styled.div`
  margin: 1em;
`;

type PreviewProps = {
  title?: string;
  slug: string;
  image: string;
  description?: string;
  loading?: boolean;
};
export const PostPreview: React.FC<PreviewProps> = ({
  title,
  slug,
  image,
  description,
  loading,
}) => {
  return (
    <PreviewContainer>
      <StrippedLink to={`/blog/${slug}`}>
        <Post>
          <PostImage loading="eager" src={image} />
          <PreviewText direction="column">
            {!loading ? (
              <Title color="white" fontSize="27px">
                {title}
              </Title>
            ) : (
              <Skeleton height={32} />
            )}
            {!loading ? (
              <PreviewDescription>{description}</PreviewDescription>
            ) : (
              <Skeleton height={12} marginTop={12} marginBottom={12} />
            )}
          </PreviewText>
        </Post>
      </StrippedLink>
    </PreviewContainer>
  );
};
