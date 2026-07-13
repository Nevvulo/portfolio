import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/src/db";
import { featuredContent } from "@/src/db/schema";
import { getPostsForBento } from "@/src/db/queries/blog";
import { getActiveProjects } from "@/src/db/queries/projects";
import { getFeaturedGames, getFeaturedSoftware } from "@/src/db/queries/software";
import { fetchDiscordWidget } from "@/utils/discord-widget";
import HomePage from "./HomePage";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export const metadata: Metadata = {
  title: "Nevulo",
  description: "Blake's personal portfolio — articles, projects, software, and more.",
  openGraph: {
    title: "Nevulo",
    url: "https://nev.so",
  },
};

export default async function Page() {
  const [
    discordWidget,
    staticLearnPosts,
    staticProjects,
    staticFeaturedSoftware,
    staticFeaturedGames,
    staticFeaturedContent,
  ] = await Promise.all([
    fetchDiscordWidget().catch(() => null),
    getPostsForBento().catch(() => null),
    getActiveProjects().catch(() => null),
    getFeaturedSoftware().catch(() => null),
    getFeaturedGames().catch(() => null),
    db.query.featuredContent
      .findMany({
        where: eq(featuredContent.slot, "hero"),
        orderBy: [asc(featuredContent.displayOrder)],
      })
      .catch(() => null),
  ]);

  return (
    <HomePage
      discordWidget={discordWidget}
      staticLearnPosts={staticLearnPosts}
      staticProjects={staticProjects}
      staticFeaturedSoftware={staticFeaturedSoftware}
      staticFeaturedGames={staticFeaturedGames}
      staticFeaturedContent={staticFeaturedContent}
    />
  );
}
