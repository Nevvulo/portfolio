import type { GetServerSidePropsContext } from "next";
import { db } from "@/src/db";
import { blogPosts } from "@/src/db/schema";
import { and, eq, desc } from "drizzle-orm";

const URL = "https://nev.so";

function generateSiteMap(
  posts: { slug: string; updatedAt: Date | null; publishedAt: Date | null }[],
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${URL}/</loc>
     </url>
     <url>
       <loc>${URL}/learn</loc>
     </url>
     <url>
       <loc>${URL}/projects</loc>
     </url>
     <url>
       <loc>${URL}/software</loc>
     </url>
     <url>
       <loc>${URL}/about</loc>
     </url>
     <url>
       <loc>${URL}/contact</loc>
     </url>
     <url>
       <loc>${URL}/credits</loc>
     </url>
     <url>
       <loc>${URL}/ai-disclosure</loc>
     </url>
     ${posts
       .map(({ slug, updatedAt, publishedAt }) => {
         const lastmod = updatedAt ?? publishedAt;
         return `
       <url>
           <loc>${URL}/learn/${slug}</loc>${lastmod ? `\n           <lastmod>${lastmod.toISOString()}</lastmod>` : ""}
       </url>
     `;
       })
       .join("")}
   </urlset>
 `;
}

export default function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps({ res }: GetServerSidePropsContext) {
  try {
    const posts = await db.query.blogPosts.findMany({
      where: and(
        eq(blogPosts.status, "published"),
        eq(blogPosts.visibility, "public"),
      ),
      columns: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: [desc(blogPosts.publishedAt)],
    });

    const sitemap = generateSiteMap(posts);

    res.setHeader("Content-Type", "text/xml");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    res.write(sitemap);
    res.end();

    return { props: {} };
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return { notFound: true };
  }
}
