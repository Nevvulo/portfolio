import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/src/db";
import { featuredContent } from "@/src/db/schema";
import { getPostsForBento } from "@/src/db/queries/blog";
import { getActiveProjects } from "@/src/db/queries/projects";
import { getFeaturedGames, getFeaturedSoftware } from "@/src/db/queries/software";
import { getStreamSettings, getUpcomingEvents } from "@/src/db/queries/stream";
import { fetchDiscordWidget } from "@/utils/discord-widget";
import { checkTwitchLiveStatus } from "@/utils/twitch";
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
    isLive,
    staticLearnPosts,
    staticProjects,
    staticFeaturedSoftware,
    staticFeaturedGames,
    staticStreamSettings,
    staticUpcomingEvents,
    staticFeaturedContent,
  ] = await Promise.all([
    fetchDiscordWidget().catch(() => null),
    checkTwitchLiveStatus().catch(() => false),
    getPostsForBento().catch(() => null),
    getActiveProjects().catch(() => null),
    getFeaturedSoftware().catch(() => null),
    getFeaturedGames().catch(() => null),
    getStreamSettings().catch(() => null),
    getUpcomingEvents().catch(() => null),
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
      isLive={isLive}
      staticLearnPosts={staticLearnPosts}
      staticProjects={staticProjects}
      staticFeaturedSoftware={staticFeaturedSoftware}
      staticFeaturedGames={staticFeaturedGames}
      staticStreamSettings={staticStreamSettings}
      staticUpcomingEvents={staticUpcomingEvents}
      staticFeaturedContent={staticFeaturedContent}
    />
  );
}
