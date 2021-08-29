import {
  faFacebook,
  faGithub,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import MDX from "@mdx-js/runtime";
import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import CodeBlock from "../../components/blog/codeblock";
import { PostFooter } from "../../components/blog/post-footer";
import { Container } from "../../components/container";
import { IconLink } from "../../components/generics";
import { Navbar } from "../../components/navbar";
import { Skeleton } from "../../components/skeleton";
import { MinimalView } from "../../components/views/minimal";
import { ROUTES } from "../../constants/routes";
import { useBlogMap } from "../../hooks/useBlogMap";
import { useRepoFile } from "../../hooks/useRepoFile";

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

  p {
    margin: 16px 4px;
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
};

const Post: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const posts = useBlogMap();
  const post = posts?.find((m) => m.slug === id);
  const filename = `${id}.mdx`;
  const filepath = `posts/${filename}`;
  const { loading, contents } = useRepoFile(filepath);
  if (!post) return <>not found</>;
  const location = `https://nevulo.xyz/blog/${post.slug}`;

  return (
    <BlogView>
      <Navbar title="Blog" route={ROUTES.BLOG.ROOT} />
      <PostContainer>
        {loading ? (
          <>
            <Skeleton height={45} marginTop={50} />
            {Array.from({ length: 25 }).map((m, i) => (
              <Skeleton
                height={Math.max(10, Math.random() * 15)}
                marginTop={
                  i % Math.max(3, Math.floor(Math.random() * 7)) === 0 ? 20 : 8
                }
              />
            ))}
          </>
        ) : (
          <>
            <MDX components={components} children={contents} />
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
                  {" "}
                  View (or edit) on GitHub
                </IconLink>
                <IconLink
                  icon={faTwitter}
                  isExternal
                  target="_blank"
                  href={generateSharableTwitterLink(post.title, location)}
                >
                  {" "}
                  Share on Twitter
                </IconLink>
                <IconLink
                  icon={faFacebook}
                  isExternal
                  target="_blank"
                  href={generateSharableFacebookLink(location)}
                >
                  {" "}
                  Share on Facebook
                </IconLink>
              </Container>
            </PostFooter>
          </>
        )}
      </PostContainer>
    </BlogView>
  );
};

export default Post;
