import React from "react";
import styled from "styled-components";
import { Container } from "../container";
import { StrippedLink } from "../generics/link";
import { Title } from "../generics/title";
import { Skeleton } from "../skeleton";
import { Label, Labels } from "./labels";

//https://codepen.io/taylorvowell/pen/BkxbC
const Post = styled.div`
  display: flex;
  flex-direction: row;
  background: ${(props) => props.theme.postBackground};
  color: black;
  border-radius: 8px;
  box-shadow: 1px 5px 8px rgba(0, 0, 0, 0.3);
  align-self: center;
  justify-self: center;
  text-decoration: none;
  max-width: 650px;
  cursor: pointer;
  margin: 1em;
  padding: 0.5em;

  @media (max-width: 460px) {
    flex-direction: column-reverse;
    margin: 1em 0;
    max-width: 350px;
    border-radius: 8px;
    padding: 0;
  }
`;

const PostImage = styled.img`
  width: 150px;
  height: 150px;
  object-fit: cover;
  margin: 1em;
  border-radius: 4px;
  background: grey;
  border: 0.1px solid ${(props) => props.theme.postImageBoxShadow};
  box-shadow: 0px 0px 8px 1px ${(props) => props.theme.postImageBoxShadow};

  @media (max-width: 460px) {
    width: auto;
    margin-bottom: 0;
    height: 100px;
  }
`;

const PreviewText = styled(Container)`
  margin: 20px 24px 0px 24px;
  max-width: 450px;
  color: ${(props) => props.theme.contrast};

  @media (max-width: 460px) {
    margin: 1em;
  }
`;

const PreviewDescription = styled.p`
  font-size: 14px;
  font-weight: 500;
  font-family: "Inter", sans-serif;
  letter-spacing: -0.5px;
  color: rgb(150, 150, 150);
`;

const PreviewContainer = styled.div`
  overflow: hidden;
  margin: 0 1em;
`;

type PreviewProps = {
  title?: string;
  slug: string;
  labels?: string[];
  image: string;
  description?: string;
  loading?: boolean;
};
export const PostPreview: React.FC<PreviewProps> = ({
  title,
  slug,
  labels,
  image,
  description,
  loading,
}) => {
  return (
    <PreviewContainer>
      <StrippedLink href={`/blog/${slug}`}>
        <Post>
          <PreviewText direction="column">
            {!loading ? (
              <Title fontSize="27px">{title}</Title>
            ) : (
              <Skeleton height={32} />
            )}
            {!loading ? (
              <PreviewDescription>{description}</PreviewDescription>
            ) : (
              <Skeleton height={12} marginTop={12} marginBottom={12} />
            )}
            <Labels>
              {labels
                .map((m) => m.replace(/-/g, " "))
                .slice(0, 3)
                .map((label) => (
                  <Label>{label}</Label>
                ))}
            </Labels>
          </PreviewText>
          <PostImage loading="eager" src={image} />
        </Post>
      </StrippedLink>
    </PreviewContainer>
  );
};
