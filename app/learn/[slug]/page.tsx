import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { getPostBySlug, getPublishedSlugs } from "@/src/db/queries/blog";
import { getCurrentUser } from "@/src/db/auth";
import { canAccessTier } from "@/src/db/auth-utils";
import { isLearnTitleAnimationEnabled } from "@/lib/flags";
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

function escapeCurlyBraces(content: string): string {
  const codeBlockRegex = /```[\s\S]*?```|`[^`\n]+`/g;
  const codeBlocks: string[] = [];
  const withPlaceholders = content.replace(codeBlockRegex, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  const escaped = withPlaceholders.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
  return escaped.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => codeBlocks[parseInt(index)] ?? "");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const enableTitleAnimation = await isLearnTitleAnimationEnabled();

  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  // Check tier access
  const user = await getCurrentUser();
  const hasAccess = canAccessTier(user?.tier, post.visibility);

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
        mdxSource={null}
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

  let mdxSource = null;
  try {
    const escapedContent = escapeCurlyBraces(processedContent);
    mdxSource = await serialize(escapedContent, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        development: process.env.NODE_ENV === "development",
      },
    });
  } catch (mdxError) {
    console.error("MDX serialization error:", mdxError);
  }

  const discordWidget = await fetchDiscordWidget().catch(() => null);

  return (
    <LearnPost
      post={{ ...post, hasAccess: true }}
      mdxSource={mdxSource}
      discordWidget={discordWidget}
      enableTitleAnimation={enableTitleAnimation}
      hasDuplicateTitle={hasDuplicateTitle}
      hasDuplicateDescription={hasDuplicateDescription}
    />
  );
}
