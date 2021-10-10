import React from "react";
import styled from "styled-components";
import GitHubAuthSection from "../../components/blog/github-auth-section";
import { BlogHomepageFooter } from "../../components/blog/homepage-footer";
import { PostPreview } from "../../components/blog/post-preview";
import { Container } from "../../components/container";
import { BackButton, Header, Text, Title } from "../../components/generics";
import { Hero } from "../../components/hero";
import { BlogView } from "../../components/views/blog";
import getFile from "../../modules/getFile";
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
`;

export default function Blog({ posts }) {
  return (
    <BlogView>
      <GitHubAuthSection />

      <Hero style={{ justifyContent: "space-between" }} image={Background.src}>
        <Header alignItems="center">
          <BackButton href="/" />
          <Title color="white">📘 Blog</Title>
        </Header>
      </Hero>

      <PostContainer>
        {!posts && <PostsLoading />}
        {posts?.map(({ title, labels, slug, image, description }) => (
          <PostPreview
            key={slug}
            title={title}
            labels={labels}
            slug={slug}
            image={image}
            description={description}
          />
        ))}
        <BlogHomepageFooter>
          <Text color="white">📚 More posts coming soon! ⏱</Text>
        </BlogHomepageFooter>
      </PostContainer>
    </BlogView>
  );
}

const PostsLoading: React.FC = () => {
  return (
    <>
      <PostPreview loading slug="loading" image="" />
      <PostPreview loading slug="loading" image="" />
      <PostPreview loading slug="loading" image="" />
    </>
  );
};

export async function getStaticProps() {
  const posts = await getFile(`blogmap.json`);
  return { props: { posts } };
}
