import {
  faDev,
  faFacebook,
  faGithub,
  faHashnode,
  faMedium,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import type { GetStaticPropsContext } from "next";
import Head from "next/head";
import { type MDXRemoteSerializeResult, MDXRemote as PostContent } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { createContext, useContext, useEffect, useState } from "react";
import remarkGfm from "remark-gfm";
// @ts-expect-error
import matter from "section-matter";
import styled, { createGlobalStyle } from "styled-components";
import {
  AIDisclosureBadge,
  getEffectiveAIStatus,
} from "../../components/badges/ai-disclosure-badge";
import { CircleIndicator } from "../../components/blog/circle-indicator";
import CodeBlock from "../../components/blog/codeblock";
import { DiscordInviteLink, isDiscordInvite } from "../../components/blog/discord-invite-link";
import { Label, Labels } from "../../components/blog/labels";
import {
  BlogPostPreview,
  Callout,
  CodePlayground,
  YouTube,
} from "../../components/blog/mdx-components";
import { PostFooter } from "../../components/blog/post-footer";
import { PostHeader } from "../../components/blog/post-header";
import { PostHeroImg } from "../../components/blog/post-hero-img";
import { PostImg } from "../../components/blog/post-img";
import { PostSubheader } from "../../components/blog/post-sub-header";
import { Container } from "../../components/container";
import { IconLink } from "../../components/generics";
import { Avatar } from "../../components/generics/avatar";
import { BlogView } from "../../components/layout/blog";
import { SimpleNavbar } from "../../components/navbar/simple";
import getFile from "../../modules/getFile";
import type { Blogmap } from "../../types/blog";
import type { DiscordWidget } from "../../types/discord";
import { fetchDiscordWidget } from "../../utils/discord-widget";

// Context for Discord widget data
const DiscordWidgetContext = createContext<DiscordWidget | null>(null);

// Component that uses the context
function DiscordLink({ href }: { href: string }) {
  const widget = useContext(DiscordWidgetContext);
  return <DiscordInviteLink href={href} widget={widget} />;
}

type PostProps = {
  content: MDXRemoteSerializeResult<Record<string, unknown>>;
  properties: Blogmap[number];
  discordWidget: DiscordWidget | null;
};
export default function Post({ content, properties, discordWidget }: PostProps) {
  const [, setCompleted] = useState(false);

  return (
    <DiscordWidgetContext.Provider value={discordWidget}>
      <CircleIndicator onComplete={() => setCompleted(true)} />
      <PostBody content={content} properties={properties} />
    </DiscordWidgetContext.Provider>
  );
}

function PostBody({ content, properties }: Omit<PostProps, "discordWidget">) {
  const location = `https://nev.so/blog/${properties.slug}`;
  const ogImage = `${
    "window" in global ? window.location.origin : "https://nev.so"
  }/blog/${properties.slug}/images/${properties.image}`;
  const filename = `${properties.slug}.mdx`;
  const filepath = `posts/${filename}`;
  const creationDate = new Date(properties.createdAt);

  return (
    <BlogView>
      <BlogStyle />
      <ReadingFocusOverlay />
      <SimpleNavbar backRoute="/blog" />

      <PostHeroImg
        coverAuthor={properties.coverAuthor}
        coverAuthorUrl={properties.coverAuthorUrl}
        src={`/blog/${properties.slug}/images/${properties.image}`}
      >
        <PostHeader>
          <PostSubheader>
            <p>
              Published on{" "}
              {creationDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}{" "}
              by <Avatar width="16" height="16" /> <strong>Nevulo</strong>{" "}
              <AIDisclosureBadge
                status={properties.aiDisclosureStatus}
                publishedAt={properties.publishedAt ?? creationDate.getTime()}
              />
            </p>
          </PostSubheader>

          <h1>{properties.title}</h1>
          <h3>{properties.description}</h3>

          {properties.labels?.length ? (
            <Labels>
              {properties.labels
                .map((m) => m.replace(/-/g, " "))
                .slice(0, 3)
                .map((label) => (
                  <Label key={label}>{label}</Label>
                ))}
            </Labels>
          ) : null}

          <IconContainer direction="row">
            <IconLink
              icon={faGithub}
              target="_blank"
              href={`https://github.com/Nevvulo/blog/blob/main/${filepath}`}
              width="24"
              height="24"
            ></IconLink>
            <IconLink
              icon={faTwitter}
              target="_blank"
              href={generateSharableTwitterLink(properties.title, location)}
              width="24"
              height="24"
            ></IconLink>
            <IconLink
              icon={faFacebook}
              target="_blank"
              href={generateSharableFacebookLink(location)}
              width="24"
              height="24"
            ></IconLink>
            {properties.mediumUrl && (
              <IconLink
                icon={faMedium}
                target="_blank"
                href={properties.mediumUrl}
                width="24"
                height="24"
              ></IconLink>
            )}
            {properties.hashnodeUrl && (
              <IconLink
                icon={faHashnode}
                target="_blank"
                href={properties.hashnodeUrl}
                width="24"
                height="24"
              ></IconLink>
            )}
            {properties.devToUrl && (
              <IconLink
                icon={faDev}
                target="_blank"
                href={properties.devToUrl}
                width="24"
                height="24"
              ></IconLink>
            )}
          </IconContainer>
        </PostHeader>
      </PostHeroImg>

      <PostContainer>
        <PostContent components={components} {...content} />
      </PostContainer>

      <PostContainer>
        <PostFooter>
          <h2 style={{ marginTop: 0 }}>Thanks for reading!</h2>
          <p style={{ color: "grey" }}>
            Feel free to share around, or if you think I've made a mistake, request a change on
            GitHub!
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
                icon={faHashnode}
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

          <AIDisclosureSection>
            <AIDisclosureLabel>
              {(() => {
                const status = getEffectiveAIStatus(
                  properties.aiDisclosureStatus,
                  properties.publishedAt ?? creationDate.getTime(),
                );
                if (status === "none") {
                  return "This article was written without AI assistance.";
                } else if (status === "llm-reviewed") {
                  return "AI tools helped review this content for clarity and formatting.";
                } else {
                  return "Less than 10% of this content was influenced by AI tools.";
                }
              })()}
            </AIDisclosureLabel>
            <AIDisclosureLink href="/ai-disclosure">
              Learn more about my AI disclosure policy
            </AIDisclosureLink>
          </AIDisclosureSection>
        </PostFooter>
      </PostContainer>

      <Head>
        <title>{String(properties.title || "")} › Blog - Nevulo</title>
        <meta name="title" content={properties.title} />
        <meta name="description" content={properties.description} />
        <meta name="author" content="Nevulo" />
        {/* OpenGraph tags */}
        <meta property="og:title" content={properties.title} />
        <meta property="og:description" content={properties.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={properties.title} />
        <meta property="og:site_name" content="Nevulo Blog" />
        <meta property="og:url" content={location} />
        <meta property="og:type" content="article" />
        <meta property="og:article:published_time" content={creationDate.toISOString()} />
        <meta property="og:article:author" content="Nevulo" />
        <meta property="og:article:section" content="Technology" />
        {properties.labels?.map((tag) => (
          <meta key={tag} property="og:article:tag" content={tag} />
        ))}
        {/* Twitter/Discord card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={properties.title} />
        <meta name="twitter:description" content={properties.description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:site" content="@Nevvulo" />
        <meta name="twitter:creator" content="@Nevvulo" />
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
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  pre: (props: any) => <CodeBlock {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  img: (props: any) => {
    const src = getPostImage(props.src || "");
    return <PostImg loading="lazy" {...props} src={src} />;
  },
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  a: (props: any) => {
    const href = props.href || "";

    // Check if it's a Discord invite link
    if (isDiscordInvite(href)) {
      return <DiscordLink href={href} />;
    }

    // External links start with http:// or https://
    const isExternal = href.startsWith("http://") || href.startsWith("https://");

    return (
      <IconLink
        style={{ textDecorationThickness: "0.125em", fontSize: "0.975em" }}
        isExternal={isExternal}
        {...props}
        href={href}
      >
        {props.children}
      </IconLink>
    );
  },
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  strong: (props: any) => <BoldText {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  h1: (props: any) => <Title {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  h2: (props: any) => <Subtitle {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  h3: (props: any) => <Heading3 {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  h4: (props: any) => <Heading4 {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  p: (props: any) => <Text {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  ol: (props: any) => <DotpointList {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  ul: (props: any) => <NumberedList {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: MDX component props
  li: (props: any) => <ListItem {...props} />,
  // Custom MDX components
  BlogPostPreview,
  YouTube,
  Callout,
  CodePlayground,
};

const IconContainer = styled(Container).attrs({ direction: "row" })`
  margin: 1em 0 0 0;

  * {
    margin-left: 6px;
    margin-right: 6px;
    height: 32px;
  }
`;

// Scroll-aware reading focus overlay component
function ReadingFocusOverlay() {
  const [showTopShadow, setShowTopShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopShadow(window.scrollY > 64);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial scroll position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <ReadingFocusOverlayStyled $showTopShadow={showTopShadow} />;
}

// iOS timer-style reading focus overlay
const ReadingFocusOverlayStyled = styled.div<{ $showTopShadow: boolean }>`
  pointer-events: none;
  position: fixed;
  left: 0;
  right: 0;
  z-index: 10;

  &::before,
  &::after {
    content: '';
    position: fixed;
    left: 0;
    right: 0;
    height: 15vh;
    pointer-events: none;
  }

  &::before {
    top: 0;
    background: linear-gradient(
      to bottom,
      ${(props) => props.theme.background} 0%,
      ${(props) => props.theme.background}ee 25%,
      ${(props) => props.theme.background}99 50%,
      ${(props) => props.theme.background}44 75%,
      transparent 100%
    );
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(1px);
    mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
    opacity: ${(props) => (props.$showTopShadow ? 1 : 0)};
    transition: opacity 0.2s ease;
  }

  &::after {
    bottom: 0;
    height: 12vh;
    background: linear-gradient(
      to top,
      ${(props) => props.theme.background} 0%,
      ${(props) => props.theme.background}cc 30%,
      ${(props) => props.theme.background}66 60%,
      transparent 100%
    );
    backdrop-filter: blur(0.5px);
    -webkit-backdrop-filter: blur(0.5px);
    mask-image: linear-gradient(to top, black 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to top, black 0%, transparent 100%);
  }
`;

const BlogStyle = createGlobalStyle`
  /* Page-level counter for ordered lists that may be interrupted by other content */
  body {
    counter-reset: page-list-counter;
  }

  pre {
    font-size: 0.9em;
    margin: 1.5em 0;
    border-radius: 8px;

    @media (max-width: 768px) {
      font-size: 0.85em;
    }

    @media (max-width: 480px) {
      font-size: 0.8em;
    }
  }

  h1, h2, h3, h4, h5, h6, p, span, li, ul {
    code {
      background: rgba(150, 150, 150, 0.25);
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-weight: 500;
      color: ${(props) => props.theme.contrast};
    }
  }

  p, span, li, ul {
    code {
      font-size: 0.85em;
    }
  }

  a > code {
    text-decoration-thickness: 0.1em;
  }

  a {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  blockquote {
    border-left: 3px solid rgba(255, 255, 255, 0.3);
    margin: 1.5em 0;
    padding: 0.5em 0 0.5em 1.5em;
    font-style: italic;
    font-size: 1em;
    opacity: 0.9;

    @media (max-width: 768px) {
      font-size: 0.95em;
    }

    @media (max-width: 480px) {
      font-size: 0.9em;
    }
  }
`;

const ListItem = styled.li`
  color: ${(props) => props.theme.textColor};
  font-size: 1em;
  line-height: 1.75;
  margin-bottom: 0.35em;

  h1, h2, h3, h4, h5, h6 {
    font-size: 1em;
    margin: 0.5em 0 0.25em 0;
    font-weight: 600;
  }

  p {
    font-size: 1em;
    margin: 0.25em 0;
  }
`;

const NumberedList = styled.ul`
  color: ${(props) => props.theme.textColor};
  line-height: 1.75;
  font-size: 1em;
  margin: 0 0 1em 0;
  padding-left: 0;
  list-style: none;

  & > li {
    position: relative;
    padding-left: 1.5em;
    margin-bottom: 0.5em;
  }

  & > li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #a5a3f5;
    font-weight: bold;
    font-size: 1.2em;
  }

  /* Nested lists */
  ul, ol {
    font-size: 1em;
    margin: 0.5em 0;
    padding-left: 1.5em;
    list-style: none;
  }

  ul li, ol li {
    position: relative;
    padding-left: 1.25em;
    margin-bottom: 0.35em;
  }

  ul li::before {
    content: "◦";
    position: absolute;
    left: 0;
    color: #a5a3f5;
    font-size: 1em;
  }

  @media (max-width: 768px) {
    font-size: 0.95em;
  }

  @media (max-width: 480px) {
    font-size: 0.9em;
  }
`;

const DotpointList = styled.ol`
  color: ${(props) => props.theme.textColor};
  line-height: 1.75;
  font-size: 1em;
  margin: 1.5em 0;
  padding-left: 0;
  list-style: none;

  & > li {
    counter-increment: page-list-counter;
    position: relative;
    padding-left: 2.5em;
    margin-bottom: 1.5em;
  }

  & > li::before {
    content: counter(page-list-counter);
    position: absolute;
    left: 0;
    top: 0;
    width: 1.6em;
    height: 1.6em;
    background: linear-gradient(135deg, rgba(79, 77, 193, 0.3), rgba(79, 77, 193, 0.15));
    border: 1px solid rgba(79, 77, 193, 0.5);
    border-radius: 50%;
    font-size: 0.85em;
    font-weight: 600;
    color: #a5a3f5;
    font-family: var(--font-mono);
    text-align: center;
    line-height: 1.6em;
  }

  /* Nested lists - reset to normal styling */
  ul, ol {
    font-size: 1em;
    margin: 0.75em 0;
    padding-left: 1.5em;
    list-style: none;
  }

  ul li, ol li {
    padding-left: 1.25em;
    margin-bottom: 0.35em;
    position: relative;
  }

  ul li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #a5a3f5;
    font-weight: bold;
  }

  /* Nested ordered lists - use their own counter */
  ol {
    counter-reset: nested-list-counter;
    padding-left: 2em;
  }

  ol li {
    counter-increment: nested-list-counter;
    padding-left: 0.5em;
  }

  ol li::before {
    content: counter(nested-list-counter) ".";
    position: absolute;
    left: -1.5em;
    color: #a5a3f5;
    font-weight: 600;
    font-family: var(--font-mono);
  }

  @media (max-width: 768px) {
    font-size: 0.95em;
  }

  @media (max-width: 480px) {
    font-size: 0.9em;
  }
`;

const BoldText = styled.span`
  color: ${(props) => props.theme.contrast};
  line-height: 1.8;
  font-size: 1em;
  font-weight: 600;
  margin: initial;
  letter-spacing: 0.3px;
  font-family: var(--font-sans);
`;

const Text = styled.p`
  color: ${(props) => props.theme.textColor};
  line-height: 1.85;
  font-size: 1.1em;
  font-weight: 400;
  letter-spacing: 0.2px;
  margin: 1.25em 0;
  font-family: var(--font-sans);

  @media (max-width: 768px) {
    font-size: 1em;
    line-height: 1.75;
  }

  @media (max-width: 480px) {
    font-size: 0.95em;
    line-height: 1.7;
  }
`;

const Title = styled.h1`
  margin-top: 1.5em;
  letter-spacing: -1.25px;
  margin-bottom: 0.5em;
  font-size: 1.9em;

  @media (max-width: 768px) {
    font-size: 1.5em;
  }

  @media (max-width: 480px) {
    font-size: 1.35em;
  }
`;

const SubtitleBase = styled.h2`
  margin-top: 2em;
  margin-bottom: 0.75em;
  font-family: var(--font-mono);
  letter-spacing: -1.25px;
  font-size: 1.5em;
  font-weight: 600;
  display: flex;
  align-items: flex-start;
  gap: 0.5em;

  + p {
    margin-top: 0.5em;
  }

  @media (max-width: 768px) {
    font-size: 1.25em;
    letter-spacing: -0.75px;
  }

  @media (max-width: 480px) {
    font-size: 1.1em;
    letter-spacing: -0.5px;
  }
`;

const NumberBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4em;
  height: 1.4em;
  padding: 0.1em;
  margin-top: 1.15em;
  background: linear-gradient(135deg, rgba(79, 77, 193, 0.3), rgba(79, 77, 193, 0.15));
  border: 1px solid rgba(79, 77, 193, 0.5);
  border-radius: 50%;
  font-size: 0.5em;
  font-weight: 600;
  color: #a5a3f5;
  font-family: var(--font-mono);
`;

// biome-ignore lint/suspicious/noExplicitAny: styled component
const Subtitle = (props: any) => {
  const text = String(props.children || "");
  const match = text.match(/^(\d+)\.\s*(.*)$/);

  if (match) {
    return (
      <SubtitleBase {...props}>
        <NumberBadge>{match[1]}</NumberBadge>
        {match[2]}
      </SubtitleBase>
    );
  }

  return <SubtitleBase {...props} />;
};

const Heading3Base = styled.h3`
  margin-top: 1.75em;
  margin-bottom: 0.5em;
  font-family: var(--font-mono);
  letter-spacing: -1px;
  font-weight: 500;
  font-size: 1.25em;
  display: flex;
  align-items: flex-start;
  gap: 0.5em;

  + p {
    margin-top: 0.5em;
  }

  @media (max-width: 768px) {
    font-size: 1.1em;
    letter-spacing: -0.5px;
  }

  @media (max-width: 480px) {
    font-size: 1em;
    letter-spacing: -0.35px;
  }
`;

// biome-ignore lint/suspicious/noExplicitAny: styled component
const Heading3 = (props: any) => {
  const text = String(props.children || "");
  const match = text.match(/^(\d+)\.\s*(.*)$/);

  if (match) {
    return (
      <Heading3Base {...props}>
        <NumberBadge>{match[1]}</NumberBadge>
        {match[2]}
      </Heading3Base>
    );
  }

  return <Heading3Base {...props} />;
};

const Heading4 = styled.h4`
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-family: var(--font-mono);
  letter-spacing: -0.35px;
  font-weight: 500;
  font-size: 1.05em;

  + p {
    margin-top: 0.5em;
  }

  @media (max-width: 768px) {
    font-size: 1em;
  }

  @media (max-width: 480px) {
    font-size: 0.95em;
  }
`;

const PostContainer = styled.div`
  font-family: var(--font-sans);
  border-radius: 4px;
  margin: 0.5em;
  max-width: 750px;
  width: 90%;
  padding: 0 1em;
`;

const AIDisclosureSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const AIDisclosureLabel = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 0.5rem 0;
`;

const AIDisclosureLink = styled.a`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;

  &:hover {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: underline;
  }
`;

export async function getStaticPaths() {
  const posts = await getFile("blogmap.json");
  if (!posts) return { notFound: true };
  return { paths: posts.map((m) => `/blog/${m.slug}`), fallback: false };
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  if (!params) return { notFound: true };

  // Skip the problematic blog post for now
  if (params.id === "what-are-data-types") {
    return { notFound: true };
  }

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

  // Fetch Discord widget data for inline invite links
  const discordWidget = await fetchDiscordWidget();

  try {
    const serializedContent = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    });
    return {
      props: {
        content: serializedContent,
        properties,
        discordWidget,
      },
      revalidate: 3600, // Revalidate Discord data every hour
    };
  } catch (error) {
    console.error(`Error serializing MDX for ${params.id}:`, error);
    return { notFound: true };
  }
}
