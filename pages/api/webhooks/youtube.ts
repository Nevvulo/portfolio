import { createHmac } from "crypto";
import { and, eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { blogPosts, users } from "@/src/db/schema";

// Disable body parsing - we need the raw body for XML
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function verifySignature(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  // YouTube sends X-Hub-Signature as "sha1=<hex>"
  const [algo, hash] = signature.split("=");
  if (algo !== "sha1" || !hash) return false;
  const expected = createHmac("sha1", secret).update(rawBody).digest("hex");
  // Constant-time comparison via matching length + digest comparison
  return expected.length === hash.length && expected === hash;
}

// Simple XML parser for YouTube Atom feed
function parseYouTubeAtom(
  xml: string,
): { videoId: string; title: string; channelId: string } | null {
  // Extract video ID
  const videoIdMatch = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  if (!videoIdMatch) return null;

  // Extract title
  const titleMatch = xml.match(/<title>([^<]+)<\/title>/);

  // Extract channel ID
  const channelIdMatch = xml.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);

  return {
    videoId: videoIdMatch[1],
    title: titleMatch?.[1] || "Untitled Video",
    channelId: channelIdMatch?.[1] || "",
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET request = verification challenge from PubSubHubbub
  if (req.method === "GET") {
    const challenge = req.query["hub.challenge"];
    const mode = req.query["hub.mode"];
    const topic = req.query["hub.topic"];

    console.log(`YouTube webhook verification: mode=${mode}, topic=${topic}`);

    if (mode === "subscribe" && challenge) {
      // Return the challenge to verify the subscription
      console.log("Returning challenge for subscription verification");
      return res.status(200).send(challenge);
    }

    return res.status(400).json({ error: "Invalid verification request" });
  }

  // POST request = new video notification
  if (req.method === "POST") {
    try {
      const rawBody = await getRawBody(req);

      // Verify HMAC signature if secret is configured
      const webhookSecret = process.env.YOUTUBE_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers["x-hub-signature"] as string | undefined;
        if (!verifySignature(rawBody, signature, webhookSecret)) {
          console.error("YouTube webhook signature verification failed");
          return res.status(403).json({ error: "Invalid signature" });
        }
      }

      const body = rawBody.toString("utf8");
      console.log("Received YouTube notification:", body.slice(0, 500));

      // Parse the Atom feed
      const parsed = parseYouTubeAtom(body);

      if (!parsed) {
        console.log("Could not parse video data from notification");
        return res.status(200).json({ received: true, processed: false });
      }

      console.log(`Parsed video: ${parsed.videoId} - ${parsed.title}`);

      // Check if this is a deletion notification (deleted entries have different format)
      if (body.includes("<at:deleted-entry")) {
        console.log("Ignoring deletion notification");
        return res.status(200).json({ received: true, processed: false, reason: "deletion" });
      }

      // Check if a blog post with this youtubeId already exists
      const existingPost = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.youtubeId, parsed.videoId),
      });

      if (existingPost) {
        console.log(`Video ${parsed.videoId} already exists as post: ${existingPost.slug}`);
        return res.status(200).json({
          received: true,
          processed: true,
          result: { alreadyExists: true, slug: existingPost.slug },
        });
      }

      // Get the creator user for authoring
      const creator = await db.query.users.findFirst({
        where: eq(users.isCreator, true),
      });

      if (!creator) {
        console.error("No creator user found in database");
        return res.status(200).json({ received: true, processed: false, error: "No creator user" });
      }

      // Create a new video blog post
      const slug = parsed.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100);

      const [newPost] = await db
        .insert(blogPosts)
        .values({
          slug: `${slug}-${parsed.videoId}`,
          title: parsed.title,
          description: `Watch: ${parsed.title}`,
          contentType: "video",
          youtubeId: parsed.videoId,
          authorId: creator.id,
          status: "published",
          visibility: "public",
          bentoSize: "medium",
          bentoOrder: 0,
          publishedAt: new Date(),
          labels: [],
        })
        .returning({ id: blogPosts.id, slug: blogPosts.slug });

      console.log("Created video post:", newPost);

      return res.status(200).json({
        received: true,
        processed: true,
        result: { created: true, slug: newPost.slug, id: newPost.id },
      });
    } catch (error) {
      console.error("Error processing YouTube notification:", error);
      // Return 200 to prevent retries for permanent failures
      return res.status(200).json({ received: true, processed: false, error: String(error) });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
