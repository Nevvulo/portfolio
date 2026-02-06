import type { Metadata } from "next";
import { Suspense } from "react";
import { getPostsForBento } from "@/src/db/queries/blog";
import LearnIndex from "./LearnIndex";

export const metadata: Metadata = {
  title: "Learn",
  description: "Articles, tutorials, and deep-dives on web development, software engineering, and more.",
  openGraph: {
    title: "Learn | Nevulo",
    description: "Articles, tutorials, and deep-dives on web development.",
    url: "https://nev.so/learn",
  },
};

export default async function Page() {
  const posts = await getPostsForBento().catch(() => []);
  return (
    <Suspense>
      <LearnIndex posts={posts} />
    </Suspense>
  );
}
