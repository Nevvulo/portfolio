import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import Head from "next/head";
import React from "react";
import styled from "styled-components";
import { BlogHomepageFooter as Footer } from "../../components/blog/footer";
import GitHubAuthSection from "../../components/blog/github-auth-section";
import { PostPreview } from "../../components/blog/post-preview";
import { Container } from "../../components/container";
import { Text } from "../../components/generics";
import { BlogView } from "../../components/layout/blog";
import { SimpleNavbar } from "../../components/navbar/simple";
import getFile from "../../modules/getFile";
import { Blogmap } from "../../types/blog";
import generateRssFeed from "../../utils/rss";
// import Background from "../../assets/img/alt-background.jpg";
// import Image from "next/image";

type BlogProps = { posts: Blogmap };
function BlogContent({ posts }: BlogProps) {
  const session = useSession({ required: false });
  const latestPost = posts[0];

  return (
    <BlogView>
      {/* <BackgroundImg /> */}
      <GitHubAuthSection session={session} />
      <SimpleNavbar id="blog" emoji="📖" title="Blog" />

      <PostContainer>
        {posts.map((properties, i) => (
          <PostPreview
            key={properties.slug}
            prioritizeImage={i < 3}
            {...properties}
          />
        ))}
      </PostContainer>

      <Head key="blog">
        <title>Blog - Nevulo</title>
        <meta property="og:title" content="Nevulo Blog" />
        <meta
          property="og:description"
          content={`${posts.length} posts ▪ ${latestPost.title}`}
        />
        <meta property="apple-mobile-web-app-title" content="Nevulo Blog" />
        <meta property="department" content="technology" />
        <meta property="audience" content="programmers" />
      </Head>
    </BlogView>
  );
}

export default function Blog(props: BlogProps & { session: Session }) {
  return (
    <SessionProvider session={props.session}>
      <BlogContent posts={props.posts} />
    </SessionProvider>
  );
}

// const BackgroundImg = styled(Image).attrs({
//   priority: true,
//   layout: "fill",
//   objectFit: "cover",
//   src: Background,
// })`
//   filter: ${(props) => (props.theme.contrast === "#000" ? "invert(1)" : "")};
//   opacity: 0.1;
//   z-index: -99 !important;
// `;

const PostContainer = styled(Container)`
  display: flex;
  align-self: center;
  flex-direction: column;
  flex-wrap: wrap;
  max-width: 650px;
  margin-top: 16px;
  border-radius: 8px;
  justify-content: center;
`;

export async function getStaticProps() {
  const posts = await getFile("blogmap.json");
  if (posts) generateRssFeed(posts);
  return { props: { posts } };
}
