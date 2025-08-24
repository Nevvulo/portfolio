import fs from "node:fs";
import { Feed } from "feed";
// @ts-expect-error
import { markdown } from "markdown";
// @ts-expect-error
import matter from "section-matter";
import getFile from "../modules/getFile";
import type { Blogmap } from "../types/blog";

async function generateRssFeed(posts: Blogmap) {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const baseUrl = "https://nevulo.xyz";
  const date = new Date();
  const author = {
    name: "Blake Ward",
    email: "hello@nevulo.xyz",
    link: "https://nevulo.xyz",
  };

  const feed = new Feed({
    title: "Nevulo Blog",
    description:
      "Programming content in a concise format. Aimed at being understandable and accessible.",
    id: baseUrl,
    link: baseUrl,
    language: "en",
    image: `${baseUrl}/images/nevulo.jpg`,
    favicon: `${baseUrl}/images/nevulo.jpg`,
    copyright: `All rights reserved ${date.getFullYear()}, Blake Ward`,
    updated: date,
    generator: "Next.js using Feed for Node.js",
    feedLinks: {
      rss2: `${baseUrl}/rss/feed.xml`,
      json: `${baseUrl}/rss/feed.json`,
      atom: `${baseUrl}/rss/atom.xml`,
    },
    author,
  });

  posts.forEach(async (post) => {
    const content = await getFile(`posts/${post.slug}.mdx`);
    if (!content) return;
    const parsed = matter(content, {
      section_delimiter: `<!--[PROPERTIES]`,
    });

    const url = `${baseUrl}/blog/${post.slug}`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.description,
      content: markdown.toHTML(parsed),
      author: [author],
      contributor: [author],
      date: new Date(post.createdAt),
    });
  });

  fs.mkdirSync("./public/rss", { recursive: true });
  fs.writeFileSync("./public/rss/feed.xml", feed.rss2());
  fs.writeFileSync("./public/rss/atom.xml", feed.atom1());
  fs.writeFileSync("./public/rss/feed.json", feed.json1());
}

export default generateRssFeed;
