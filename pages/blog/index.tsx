import Head from "next/head";
import React from "react";
import styled from "styled-components";
import GitHubAuthSection from "../../components/blog/github-auth-section";
import { BlogHomepageFooter } from "../../components/blog/homepage-footer";
import { PostPreview } from "../../components/blog/post-preview";
import { Container } from "../../components/container";
import {
  BackButton,
  Header,
  Text,
  Title,
  Emoji,
} from "../../components/generics";
import { HeroContainer, HeroImage } from "../../components/hero";
import { BlogView } from "../../components/views/blog";
import getFile from "../../modules/getFile";

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

const Background = styled.div`
  width: 100%;
  background: url("/alt-background.png");
  height: 100%;
  opacity: 0.5;
  z-index: -1;
  position: fixed;
  top: 0;
`;

export default function Blog({ posts }) {
  const latestPost = posts[0];
  return (
    <BlogView>
      <Head>
        <title>Blog - Nevulo</title>
        <meta property="og:title" content="Nevulo Blog" />
        <meta
          property="og:description"
          content={`${posts.length} posts ▪ ${latestPost.title}`}
        />
      </Head>
      <GitHubAuthSection />

      <Background />
      <Header justifyContent="center" direction="column">
        <Container alignItems="center">
          <BackButton href="/" />
          <Title fontSize="36px" color="white">
            <Emoji>📖</Emoji> Blog
          </Title>
        </Container>
      </Header>

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
