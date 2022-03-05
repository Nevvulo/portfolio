import {
  faDev,
  faFacebook,
  faGithub,
  faMedium,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import * as Fathom from "fathom-client";
import { useViewportScroll } from "framer-motion";
import { GetStaticPropsContext } from "next";
import {
  MDXRemote as PostContent,
  MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Head from "next/head";
import React, { ReactNode, useEffect, useState } from "react";
// @ts-expect-error
import matter from "section-matter";
import styled from "styled-components";
import { CircleIndicator } from "../../components/blog/circle-indicator";
import CodeBlock from "../../components/blog/codeblock";
import Comments from "../../components/blog/comments";
import { PostFooter } from "../../components/blog/post-footer";
import { PostHeader } from "../../components/blog/post-header";
import { PostHeroImg } from "../../components/blog/post-hero-img";
import { PostImg } from "../../components/blog/post-img";
import { PostSubheader } from "../../components/blog/post-sub-header";
import { NewsletterSubscription } from "../../components/blog/subscribe";
import { Container } from "../../components/container";
import { IconLink } from "../../components/generics";
import { Avatar } from "../../components/generics/avatar";
import { BlogView } from "../../components/layout/blog";
import { DetailedNavbar } from "../../components/navbar/detailed";
import { useComments } from "../../hooks/useComments";
import { useNewsletterSubscribe } from "../../hooks/useNewsletterSubscribe";
import getFile from "../../modules/getFile";
import { Blogmap } from "../../types/blog";

type PostProps = {
  content: MDXRemoteSerializeResult<Record<string, unknown>>;
  properties: Blogmap[number];
};
export default function Post({ content, properties }: PostProps) {
  const { scrollYProgress } = useViewportScroll();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // finished blog post goal
    if (completed) Fathom.trackGoal("5RLNED6W", 0);
  }, [completed]);

  return (
    <>
      <CircleIndicator
        onComplete={() => setCompleted(true)}
        scrollYProgress={scrollYProgress}
      />
      <PostBody content={content} properties={properties} />
    </>
  );
}

function PostBody({ content, properties }: PostProps) {
  const location = `https://nevulo.xyz/blog/${properties.slug}`;
  const ogImage = `${
    "window" in global ? window.location.origin : "https://nevulo.xyz"
  }/blog/${properties.slug}/images/${properties.image}`;
  const filename = `${properties.slug}.mdx`;
  const filepath = `posts/${filename}`;
  const creationDate = new Date(properties.createdAt);
  const newsletter = useNewsletterSubscribe();
  const { total, comments, postComment } = useComments(
    properties.discussionNo,
    properties.discussionId
  );

  return (
    <BlogView>
      <DetailedNavbar />

      <PostHeroImg
        coverAuthor={properties.coverAuthor}
        coverAuthorUrl={properties.coverAuthorUrl}
        src={`/blog/${properties.slug}/images/${properties.image}`}
      >
        <PostHeader>
          <PostSubheader>
            <p>
              Published on {creationDate.toLocaleDateString()} by{" "}
              <Avatar width="16" height="16" /> <strong>Nevulo</strong>{" "}
            </p>
          </PostSubheader>

          <h1>{properties.title}</h1>
          <h3>{properties.description}</h3>
        </PostHeader>
      </PostHeroImg>

      <PostContainer>
        <PostContent components={components} {...content} />
      </PostContainer>

      <PostContainer>
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
              width="16"
              height="16"
            >
              View (or edit) on GitHub
            </IconLink>
            <IconLink
              icon={faTwitter}
              isExternal
              target="_blank"
              href={generateSharableTwitterLink(properties.title, location)}
              width="16"
              height="16"
            >
              Share on Twitter
            </IconLink>
            <IconLink
              icon={faFacebook}
              isExternal
              target="_blank"
              href={generateSharableFacebookLink(location)}
              width="16"
              height="16"
            >
              Share on Facebook
            </IconLink>
            {properties.mediumUrl && (
              <IconLink
                icon={faMedium}
                isExternal
                target="_blank"
                href={properties.mediumUrl}
                width="16"
                height="16"
              >
                View & share on Medium
              </IconLink>
            )}
            {properties.hashnodeUrl && (
              <IconLink
                icon={["fab", "hashnode"]}
                isExternal
                target="_blank"
                href={properties.hashnodeUrl}
                width="16"
                height="16"
              >
                View & share on Hashnode
              </IconLink>
            )}
            {properties.devToUrl && (
              <IconLink
                icon={faDev}
                isExternal
                target="_blank"
                href={properties.devToUrl}
                width="16"
                height="16"
              >
                View & share on dev.to
              </IconLink>
            )}
          </Container>
        </PostFooter>

        <NewsletterSubscription
          onSubscribe={newsletter.subscribe}
          loading={newsletter.loading}
          error={newsletter.error}
          success={newsletter.success}
        />

        <Comments
          total={total}
          comments={comments || []}
          onCommentSubmitted={postComment}
        />
      </PostContainer>

      <Head>
        <title>{properties.title} › Blog - Nevulo</title>
        <meta property="title" content={properties.title} />
        <meta property="description" content={properties.description} />
        <meta property="og:title" content={properties.title} />
        <meta property="og:description" content={properties.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Nevulo Blog" />
        <meta property="og:url" content={location} />
        <meta property="og:type" content="article" />
        <meta property="twitter:title" content={properties.title} />
        <meta property="twitter:description" content={properties.description} />
        <meta property="twitter:image" content={ogImage} />
        <meta property="twitter:site" content="@Nevvulo" />
        <meta property="twitter:creator" content="@Nevvulo" />
        <meta property="creator" content="Nevulo" />
        <meta
          property="og:article:published_time"
          content={creationDate.toISOString()}
        />
        <meta property="og:article:author:username" content="Nevulo" />
        <meta property="og:article:section" content="Technology" />
        {properties.labels?.map((tag) => (
          <meta property="og:article:tag" content={tag} />
        ))}
      </Head>
    </BlogView>
  );
}

const generateSharableTwitterLink = (title: string, link: string) =>
  `https://twitter.com/intent/tweet?text=Check out "${title}" at ${link}!`;
const generateSharableFacebookLink = (link: string) =>
  `https://www.facebook.com/sharer/sharer.php?u=${link}`;

const getPostImage = (src: string) => {
  const isRelative = src.startsWith("./");
  const [, , slug, asset] = src.split("/");
  return isRelative && asset ? `/blog/${slug}/images/${asset}` : src;
};

const components = {
  pre: (props: never) => <CodeBlock {...props} />,
  img: (props: any) => {
    const src = getPostImage(props.src);
    return <PostImg loading="lazy" {...props} src={src} />;
  },
  a: (props: { children: ReactNode; href: string }) => (
    <IconLink
      style={{ fontSize: "inherit" }}
      isExternal={!props.href.startsWith("https://nevulo.xyz")}
      {...props}
      href={props.href}
    >
      {props.children}
    </IconLink>
  ),
  h1: (props: never) => <Title {...props} />,
  h2: (props: never) => <Subtitle {...props} />,
  h3: (props: never) => <Heading3 {...props} />,
  h4: (props: never) => <Heading4 {...props} />,
  p: (props: never) => <Text {...props} />,
  ol: (props: never) => <DotpointList {...props} />,
  ul: (props: never) => <NumberedList {...props} />,
};

const NumberedList = styled.ul`
  color: ${(props) => props.theme.textColor};
  line-height: 1.55;
  font-size: 1.1em;

  code {
    background: rgba(150, 150, 150, 0.3);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-weight: 600;
  }
`;

const DotpointList = styled.ol`
  color: ${(props) => props.theme.textColor};
  line-height: 1.55;
  font-size: 1.1em;

  code {
    background: rgba(150, 150, 150, 0.3);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-weight: 600;
  }
`;

const Text = styled.p`
  color: ${(props) => props.theme.textColor};
  line-height: 1.55;
  font-size: 1.1em;
  font-weight: 400;
  letter-spacing: 0.3px;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Roboto", sans-serif;

  code {
    background: rgba(150, 150, 150, 0.3);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-weight: 600;
  }
`;

const Title = styled.h1`
  margin-top: 0.75em;
  letter-spacing: -1.25px;
  margin-bottom: 0px;
  font-size: 32px;
`;

const Subtitle = styled.h2`
  margin-top: 1.35em;
  margin-bottom: 0px;
  font-family: "Fira Code", sans-serif;
  letter-spacing: -1.55px;
  font-size: 28px;
  font-weight: 600;

  + p {
    margin-top: 0.35em;
  }

  code {
    background: rgba(150, 150, 150, 0.3);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-weight: 600;
  }
`;

const Heading3 = styled.h3`
  margin-top: 1.2em;
  margin-bottom: 0px;
  font-family: "Fira Code", sans-serif;
  letter-spacing: -1.5px;
  font-weight: 500;
  font-size: 24px;

  + p {
    margin-top: 0.25em;
  }

  code {
    background: rgba(150, 150, 150, 0.3);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-weight: 600;
  }
`;

const Heading4 = styled.h4`
  margin-top: 2em;
  margin-bottom: 0px;
  font-family: "Fira Code", sans-serif;
  letter-spacing: -0.45px;
  font-weight: 500;
  font-size: 18px;

  * {
    padding-left: 1em;
  }

  + p {
    margin-top: 0.25em;
  }

  code {
    background: rgba(150, 150, 150, 0.3);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-weight: 600;
  }
`;

const PostContainer = styled.div`
  @import url("https://fonts.googleapis.com/css2?family=Fira+Code&display=swap");
  font-family: "Inter", sans-serif;
  border-radius: 4px;
  margin: 0.5em;
  max-width: 700px;
  width: 90%;
`;

export async function getStaticPaths() {
  const posts = await getFile("blogmap.json");
  if (!posts) return { notFound: true };
  return { paths: posts.map((m) => `/blog/${m.slug}`), fallback: false };
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  if (!params) return { notFound: true };
  const posts = await getFile("blogmap.json");
  if (!posts) return { notFound: true };
  const post = await getFile(`posts/${params.id}.mdx`, "text");
  if (!post) return { notFound: true };
  const contents = post.replace(/^#(.+)/g, "");
  const parsed = matter(contents, {
    section_delimiter: `<!--[PROPERTIES]`,
  });
  const properties = posts.find((post) => post.slug === params.id);
  const { content } = parsed;
  return {
    props: {
      content: await serialize(content),
      properties,
    },
  };
}
