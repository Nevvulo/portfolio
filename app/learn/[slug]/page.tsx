import type { Metadata } from "next";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { getPostBySlug, getPublishedSlugs } from "@/src/db/queries/blog";
import { getCurrentUser } from "@/src/db/auth";
import { canAccessTier } from "@/src/db/auth-utils";
import { fetchDiscordWidget } from "@/utils/discord-widget";
import LearnPost from "./LearnPost";

// ISR: regenerate every 60s, render on-demand if not pre-built
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getPublishedSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // DB unreachable at build time (e.g. local builds) — render on demand
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  const ogImage = `https://nev.so/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(post.description.slice(0, 100))}`;

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://nev.so/learn/${slug}`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: [
        {
          url: post.coverImage || ogImage,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

// Helpers for detecting duplicate title/description in MDX content
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function detectDuplicates(
  content: string,
  title: string,
  description: string,
): { hasDuplicateTitle: boolean; hasDuplicateDescription: boolean } {
  const lines = content.trim().split("\n");
  if (lines.length < 1) return { hasDuplicateTitle: false, hasDuplicateDescription: false };

  const firstLine = lines[0];
  if (!firstLine) return { hasDuplicateTitle: false, hasDuplicateDescription: false };
  const firstLineTrimmed = firstLine.trim();
  const hasDuplicateTitle =
    firstLineTrimmed.startsWith("# ") &&
    normalizeForComparison(firstLineTrimmed.slice(2)) === normalizeForComparison(title);

  let hasDuplicateDescription = false;
  for (let i = 1; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (!line) continue;
    const lineTrimmed = line.trim();
    if (lineTrimmed === "") continue;
    if (lineTrimmed.startsWith("#")) break;
    if (normalizeForComparison(lineTrimmed) === normalizeForComparison(description)) {
      hasDuplicateDescription = true;
    }
    break;
  }

  return { hasDuplicateTitle, hasDuplicateDescription };
}

function stripDuplicates(
  content: string,
  title: string,
  description: string,
  hasDuplicateTitle: boolean,
  hasDuplicateDescription: boolean,
): string {
  if (!hasDuplicateTitle && !hasDuplicateDescription) return content;

  const lines = content.split("\n");
  let linesToRemove = 0;

  if (hasDuplicateTitle && lines[0]?.trim().startsWith("# ")) {
    linesToRemove = 1;
    while (linesToRemove < lines.length && lines[linesToRemove]?.trim() === "") {
      linesToRemove++;
    }
  }

  if (hasDuplicateDescription && linesToRemove < lines.length) {
    const nextLine = lines[linesToRemove]?.trim();
    if (
      nextLine &&
      !nextLine.startsWith("#") &&
      normalizeForComparison(nextLine) === normalizeForComparison(description)
    ) {
      linesToRemove++;
      while (linesToRemove < lines.length && lines[linesToRemove]?.trim() === "") {
        linesToRemove++;
      }
    }
  }

  return lines.slice(linesToRemove).join("\n");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  // Title animation: hardcoded to avoid calling the flag system which uses
  // Clerk's auth() internally, forcing dynamic rendering and breaking ISR.
  const enableTitleAnimation = false;

  // For public posts, skip auth entirely so the page stays ISR-cacheable.
  // Calling auth()/getCurrentUser() reads cookies which forces Next.js into
  // dynamic streaming SSR — crawlers and LLMs then only see the loading.tsx
  // spinner because the actual content arrives as RSC payload in <script> tags.
  //
  // For non-public (tier-gated) posts, we still need auth to check access.
  // Those pages become dynamic, which is fine since their content is restricted.
  let hasAccess = true;
  if (post.visibility !== "public") {
    const user = await getCurrentUser();
    hasAccess = canAccessTier(user?.tier, post.visibility);
  }

  if (!hasAccess) {
    // Return post metadata without body for tier-locked content
    return (
      <LearnPost
        post={{
          ...post,
          body: null,
          hasAccess: false,
          requiredTier: post.visibility,
        }}
        contentHtml={null}
        discordWidget={null}
        enableTitleAnimation={enableTitleAnimation}
        hasDuplicateTitle={false}
        hasDuplicateDescription={false}
      />
    );
  }

  const rawContent = post.body ?? "";

  const { hasDuplicateTitle, hasDuplicateDescription } = detectDuplicates(
    rawContent,
    post.title,
    post.description,
  );

  const processedContent = stripDuplicates(
    rawContent,
    post.title,
    post.description,
    hasDuplicateTitle,
    hasDuplicateDescription,
  );

  const discordWidget = await fetchDiscordWidget().catch(() => null);

  // Compile MDX/markdown → HTML on the server using remark/rehype.
  // This produces plain HTML that goes directly into the static page,
  // making article content visible to crawlers, LLMs, and link unfurlers.
  // The BlogStyle global CSS in LearnPost handles styling.
  // rehype-slug adds IDs to headings for TOC navigation.
  let contentHtml: string | null = null;
  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSlug)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(processedContent);
    contentHtml = String(result);
  } catch (mdxError) {
    console.error("MDX compilation error:", mdxError);
  }

  return (
    <LearnPost
      post={{ ...post, hasAccess: true }}
      contentHtml={contentHtml}
      discordWidget={discordWidget}
      enableTitleAnimation={enableTitleAnimation}
      hasDuplicateTitle={hasDuplicateTitle}
      hasDuplicateDescription={hasDuplicateDescription}
    />
  );
}
