import {
  faFacebook,
  faGithub,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import React from "react";
import matter from "section-matter";
import styled from "styled-components";
import CodeBlock from "../../components/blog/codeblock";
import Comments from "../../components/blog/comments";
import { PostFooter } from "../../components/blog/post-footer";
import { PostHeroImg } from "../../components/blog/post-hero-img";
import { PostImg } from "../../components/blog/post-img";
import { Container } from "../../components/container";
import { IconLink } from "../../components/generics";
import { Navbar } from "../../components/navbar";
import { MinimalView } from "../../components/views/minimal";
import { ROUTES } from "../../constants/routes";
import { useComments } from "../../hooks/useComments";
import getFile from "../../modules/getFile";

const PostContainer = styled.div`
  @import url("https://fonts.googleapis.com/css2?family=Fira+Code&display=swap");
  font-family: "Inter", sans-serif;
  padding: 0em 1em;
  border-radius: 4px;
  margin: 0.5em;

  h1 {
    margin-top: 38px;
    letter-spacing: -1.5px;
    margin-bottom: 0px;
  }

  h2 {
    margin-top: 32px;
    margin-bottom: 12px;
  }

  a {
    color: #9074f2;
    font-family: "Fira Code", monospace;
    font-size: 15px;
    font-weight: 600;
  }

  pre {
    padding: 1em;
    border-radius: 6px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.7);
  }

  p > code,
  h2 > code {
    background: rgba(150, 150, 150, 0.3);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-weight: 600;
  }
`;

export const BlogView = styled(MinimalView)`
  display: block;
  width: 100%;
  overflow: auto;
  padding: 0;
  margin-left: auto;
  margin-right: auto;
  height: 100%;
  max-width: 700px;
`;

const generateSharableTwitterLink = (title: string, link: string) =>
  `https://twitter.com/intent/tweet?text=Check out "${title}" at ${link}!`;
const generateSharableFacebookLink = (link: string) =>
  `https://www.facebook.com/sharer/sharer.php?u=${link}`;

const components = {
  pre: (props: any) => <CodeBlock {...props} />,
  img: (props: any) => <PostImg loading="lazy" {...props} />,
};

function Post({ content, properties }) {
  const { total, comments, postComment } = useComments(
    properties.discussionNo,
    properties.discussionId
  );
  if (!content) return <>not found</>;
  const location = `https://nevulo.xyz/blog/${properties.slug}`;
  const filename = `${properties.slug}.mdx`;
  const filepath = `posts/${filename}`;
  return (
    <BlogView>
      <Navbar title="Blog" route={ROUTES.BLOG.ROOT} />
      <PostContainer>
        <PostHeroImg src={properties.image} />
        <MDXRemote components={components} {...content} />
        <PostFooter>
          <h2 style={{ marginTop: 0 }}>Thanks for reading!</h2>
          <p style={{ color: "grey" }}>
            Feel free to share around, or if you think I've made a mistake,
            request a change on GitHub!
          </p>
          <Container direction="column">
            <IconLink
              icon={faGithub}
              isExternal
              target="_blank"
              href={`https://github.com/Nevvulo/blog/blob/main/${filepath}`}
            >
              View (or edit) on GitHub
            </IconLink>
            <IconLink
              icon={faTwitter}
              isExternal
              target="_blank"
              href={generateSharableTwitterLink(properties.title, location)}
            >
              Share on Twitter
            </IconLink>
            <IconLink
              icon={faFacebook}
              isExternal
              target="_blank"
              href={generateSharableFacebookLink(location)}
            >
              Share on Facebook
            </IconLink>
          </Container>
        </PostFooter>
        <Comments
          total={total}
          comments={comments}
          onCommentSubmitted={postComment}
        />
      </PostContainer>
    </BlogView>
  );
}

export default Post;

export async function getStaticPaths() {
  const posts = await getFile("blogmap.json");
  return { paths: posts.map((m) => `/blog/${m.slug}`), fallback: false };
}

export async function getStaticProps({ params }) {
  const posts = await getFile("blogmap.json");
  const post = await getFile(`posts/${params.id}.mdx`, "text");
  const parsed = matter(post, {
    section_delimiter: `<!--[PROPERTIES]`,
  });
  const properties = posts.find((post) => post.slug === params.id);
  const { content } = parsed;
  return { props: { content: await serialize(content), properties } };
}
