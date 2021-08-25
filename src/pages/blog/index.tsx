import { AnimatePresence } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { Hero } from "../../components/hero";
import { BlogHomepageFooter } from "../../components/blog/homepage-footer";
import { PostPreview } from "../../components/blog/post-preview";
import { AnimatedContainer, Container } from "../../components/container";
import { BackButton, Header, Text, Title } from "../../components/generics";
import { BlogView } from "../../components/views/blog";
import { Page } from "../../components/views/page";
import { useBlogMap } from "../../hooks/useBlogMap";
import Background from "./../../assets/img/section-background.jpg";

const PostContainer = styled(Container)`
  display: flex;
  align-self: center;
  flex-direction: column;
  flex-wrap: wrap;
  max-width: 650px;
  margin-top: 32px;
  border-radius: 8px;
  justify-content: center;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
  }
`;

const Blog: React.FC = () => {
  const posts = useBlogMap();
  return (
    <BlogView>
      <Page>
        <AnimatePresence>
          <Hero image={Background}>
            <Header alignItems="center">
              <BackButton to="/" />
              <Title color="white">📘 Blog</Title>
            </Header>
          </Hero>
        </AnimatePresence>
        <PostContainer>
          {!posts && <PostsLoading />}
          {posts?.map(({ title, slug, image, description }) => (
            <PostPreview
              key={slug}
              title={title}
              slug={slug}
              image={image}
              description={description}
            />
          ))}
          <BlogHomepageFooter>
            <Text color="white">📚 More posts coming soon! ⏱</Text>
          </BlogHomepageFooter>
        </PostContainer>
      </Page>
    </BlogView>
  );
};

const PostsLoading: React.FC = () => {
  return (
    <>
      <PostPreview loading slug="loading" image="" />
      <PostPreview loading slug="loading" image="" />
      <PostPreview loading slug="loading" image="" />
    </>
  );
};

export default Blog;
