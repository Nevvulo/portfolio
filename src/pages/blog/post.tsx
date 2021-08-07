import MDX from "@mdx-js/runtime";
import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Navbar } from "../../components/navbar";
import CodeBlock from "../../components/blog/codeblock";
import { BackButton } from "../../components/generics";
import { MinimalView } from "../../components/views/minimal";
import Colors from "../../constants/colors";
import { useRepoFile } from "../../hooks/useRepoFile";
import { ROUTES } from "../../constants/routes";

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

const Skeleton = styled.div<{ height: number; space: number }>`
  background: #1c1c1c;
  color: transparent;
  position: relative;
  overflow: hidden;
  height: ${(props) => props.height}px;
  margin-top: ${(props) => props.space}px;

  ::before {
    content: "";
    position: absolute;
    left: 0%;
    top: 0;
    height: 100%;
    width: 50px;
    background: linear-gradient(
      to right,
      #1e1e1e 25%,
      #313131 50%,
      #3b3b3b 100%
    );
    animation-name: gradient-animation;
    animation-duration: 2s;
    animation-iteration-count: infinite;
    filter: blur(5px);
  }

  @keyframes gradient-animation {
    from {
      left: 0%;
    }
    to {
      left: 100%;
    }
  }
`;

const components = {
  pre: (props: any) => <CodeBlock {...props} />,
};

const Post: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { loading, contents } = useRepoFile(`${id}.mdx`);
  return (
    <BlogView>
      <Navbar title="Blog" route={ROUTES.BLOG.ROOT} />
      <PostContainer>
        {loading ? (
          <>
            <Skeleton height={45} space={50} />
            {Array.from({ length: 25 }).map((m, i) => (
              <Skeleton
                height={Math.max(10, Math.random() * 15)}
                space={
                  i % Math.max(3, Math.floor(Math.random() * 7)) === 0 ? 20 : 8
                }
              />
            ))}
          </>
        ) : (
          <MDX components={components} children={contents} />
        )}
      </PostContainer>
    </BlogView>
  );
};

export default Post;
