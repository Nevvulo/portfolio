import Head from "next/head";
import styled from "styled-components";
import { PostPreview } from "../../components/blog/post-preview";
import { Container } from "../../components/container";
import { BlogView } from "../../components/layout/blog";
import { SimpleNavbar } from "../../components/navbar/simple";
import getFile from "../../modules/getFile";
import type { Blogmap } from "../../types/blog";
import generateRssFeed from "../../utils/rss";

// import Background from "../../assets/img/alt-background.jpg";
// import Image from "next/image";

type BlogProps = { posts: Blogmap };
export default function Blog({ posts }: BlogProps) {
  return (
    <BlogView>
      {/* <BackgroundImg /> */}
      <SimpleNavbar title="Blog" />

      <PostContainer>
        {posts.map((properties, i) => (
          <PostPreview key={properties.slug} prioritizeImage={i < 3} {...properties} />
        ))}
      </PostContainer>

      <Head key="blog">
        <title>nevulo - Blog</title>
        <meta
          name="description"
          content={`Read my latest thoughts on software engineering, web development, and technology. ${posts.length} articles and counting.`}
        />
        <meta property="og:title" content="nevulo - Blog" />
        <meta
          property="og:description"
          content={`Read my latest thoughts on software engineering, web development, and technology. ${posts.length} articles and counting.`}
        />
        <meta property="og:url" content="https://nev.so/blog" />
        <meta property="og:site_name" content="nevulo" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Blog&subtitle=Software%20Engineering%20Insights"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="nevulo - Blog" />
        <meta
          name="twitter:description"
          content={`${posts.length} articles on software engineering and web development.`}
        />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Blog&subtitle=Software%20Engineering%20Insights"
        />
        <meta property="apple-mobile-web-app-title" content="nevulo - Blog" />
        <meta property="department" content="technology" />
        <meta property="audience" content="programmers" />
      </Head>
    </BlogView>
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
  padding: 0 1.5rem;

  @media (max-width: 480px) {
    padding: 0 1rem;
  }
`;

export async function getStaticProps() {
  const posts = await getFile("blogmap.json");
  if (posts) generateRssFeed(posts);
  return { props: { posts } };
}
