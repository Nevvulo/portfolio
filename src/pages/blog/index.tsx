import { AnimatePresence } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { AnimatedContainer, Container } from "../../components/container";
import {
  BackButton,
  Header,
  StrippedLink,
  Title,
  Text,
} from "../../components/generics";
import { MinimalView } from "../../components/views/minimal";
import { Gradients } from "../../constants/colors";
import { useBlogMap } from "../../hooks/useBlogMap";

export const BlogView = styled(MinimalView)`
  height: 100%;
  justify-content: flex-start;
  flex-direction: column;
  padding: 1em max(20%, 52px);

  @media (max-width: 768px) {
    padding: 1em min(10%, 12px);
  }
`;

type PreviewProps = {
  title: string;
  slug: string;
  image: string;
  description: string;
};
const PostContainer = styled(Container)`
  display: flex;
  align-self: center;
  flex-direction: column;
  flex-wrap: wrap;
  max-width: 650px;
  justify-content: center;
`;
const Post = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  background: ${Gradients.BLOG_POST};
  border-radius: 12px;
  align-self: center;
  justify-self: center;
  text-decoration: none;
  margin: 1em;

  @media (max-width: 460px) {
    flex-direction: column;
    width: 90%;
  }
`;
const PostImage = styled.img`
  width: 150px;
  border-radius: 12px 0 0 12px;
  background: grey;

  @media (max-width: 460px) {
    width: 100%;
    border-radius: 12px 12px 0 0;
  }
`;
const PreviewText = styled(Container)`
  margin: 12px 24px 0px 24px;
`;
const PreviewDescription = styled.p`
  font-size: 14px;
  font-weight: 600;
  font-family: "Inter", sans-serif;
  color: rgb(200, 200, 200);
`;

const Preview: React.FC<PreviewProps> = ({
  title,
  slug,
  image,
  description,
}) => {
  return (
    <StrippedLink to={`/blog/${slug}`}>
      <Post>
        <PostImage loading="eager" src={image} />
        <PreviewText direction="column">
          <Title fontSize="27px">{title}</Title>
          <PreviewDescription>{description}</PreviewDescription>
        </PreviewText>
      </Post>
    </StrippedLink>
  );
};

const Blog: React.FC = () => {
  const posts = useBlogMap();
  return (
    <BlogView>
      <AnimatedContainer direction="column" style={{ width: "100%" }}>
        <AnimatePresence>
          <Header alignItems="center">
            <BackButton to="/" />
            <Title>Blog</Title>
          </Header>
        </AnimatePresence>
        <PostContainer>
          {!posts && <PostsLoading />}
          {posts?.map(({ title, slug, image, description }) => (
            <Preview
              key={slug}
              title={title}
              slug={slug}
              image={image}
              description={description}
            />
          ))}
        </PostContainer>
        <Container alignSelf="center">
          <Text color="darkgrey">More posts coming soon!</Text>
        </Container>
      </AnimatedContainer>
    </BlogView>
  );
};

const PostsLoading: React.FC = () => {
  return (
    <>
      <Preview title="..." description="" slug="loading" image="" />
      <Preview title="..." description="" slug="loading" image="" />
      <Preview title="..." description="" slug="loading" image="" />
    </>
  );
};

export default Blog;
