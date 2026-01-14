import type { NextApiRequest, NextApiResponse } from "next";
import { createHmac, timingSafeEqual } from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

// Disable body parsing - we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

// Payload structure from Continuous
interface ContinuousWebhookPayload {
  event: "content.published" | "content.updated" | "content.unpublished" | "test";
  timestamp: number;
  content: {
    id: string;
    type: "blog_post" | "video" | "code_snippet" | "course";
    title: string;
    slug: string;
    description: string;
    authorName: string;
    tags: string[];
    category?: string;
    thumbnail?: string;
    visibility: "public" | "private" | "unlisted";
    publishedAt?: number;
    createdAt: number;
    updatedAt: number;
  };
  typeData: {
    content?: string;
    excerpt?: string;
    readTime?: number;
    featuredImage?: string;
    metadata?: {
      difficulty?: "beginner" | "intermediate" | "advanced";
      keyIdeas?: string[];
      aiDisclosure?: "none" | "llm-assisted" | "llm-reviewed";
      bentoSize?: "small" | "medium" | "large" | "banner" | "featured";
      bentoOrder?: number;
      customFields?: Record<string, unknown>;
    };
  };
  source: {
    app: string;
    version: string;
  };
}

function verifySignature(
  payload: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = createHmac("sha256", secret);
    hmac.update(timestamp + "." + payload);
    const expectedSignature = hmac.digest("hex");

    // Use timing-safe comparison
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const WEBHOOK_SECRET = process.env.CONTINUOUS_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("Continuous webhook secret not configured");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  // Get signature headers
  const timestamp = req.headers["x-continuous-timestamp"] as string;
  const signature = req.headers["x-continuous-signature"] as string;
  const event = req.headers["x-continuous-event"] as string;

  if (!timestamp || !signature) {
    console.warn("Missing Continuous webhook headers");
    return res.status(400).json({ error: "Missing signature headers" });
  }

  // Verify timestamp is not too old (5 minute window)
  const timestampMs = parseInt(timestamp, 10);
  const now = Date.now();
  if (isNaN(timestampMs) || Math.abs(now - timestampMs) > 5 * 60 * 1000) {
    console.warn("Continuous webhook timestamp too old or invalid");
    return res.status(400).json({ error: "Invalid timestamp" });
  }

  // Get and verify payload
  const rawBody = await getRawBody(req);

  if (!verifySignature(rawBody, timestamp, signature, WEBHOOK_SECRET)) {
    console.warn("Continuous webhook signature verification failed");
    return res.status(401).json({ error: "Invalid signature" });
  }

  let payload: ContinuousWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  console.log(`Received Continuous webhook: ${payload.event}`, {
    contentId: payload.content?.id,
    contentType: payload.content?.type,
    title: payload.content?.title,
  });

  // Handle test event
  if (payload.event === "test") {
    return res.status(200).json({
      success: true,
      message: "Test webhook received successfully",
      receivedAt: new Date().toISOString(),
    });
  }

  // Only process blog posts for now
  if (payload.content.type !== "blog_post") {
    console.log(`Skipping non-blog content type: ${payload.content.type}`);
    return res.status(200).json({
      success: true,
      message: `Content type ${payload.content.type} not supported yet`,
    });
  }

  // Initialize Convex client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  try {
    switch (payload.event) {
      case "content.published": {
        // Map Continuous data to nev.so schema
        const blogPostData = {
          slug: payload.content.slug,
          title: payload.content.title,
          description: payload.content.description,
          content: payload.typeData.content || "",
          contentType: "article" as const, // Default to article
          coverImage: payload.content.thumbnail || payload.typeData.featuredImage,
          labels: payload.content.tags || [],
          difficulty: payload.typeData.metadata?.difficulty,
          readTimeMins: payload.typeData.readTime,
          keyIdeas: payload.typeData.metadata?.keyIdeas,
          aiDisclosureStatus: payload.typeData.metadata?.aiDisclosure,
          visibility: mapVisibility(payload.content.visibility),
          bentoSize: payload.typeData.metadata?.bentoSize || "medium",
          status: "published" as const,
          publishedAt: payload.content.publishedAt || Date.now(),
          createdAt: payload.content.createdAt,
          // Custom fields can store the original Continuous ID for reference
          // This would need a schema update to support
        };

        // Check if post already exists by slug
        // If exists, update it; otherwise create new
        // For now, we'll use createMigrated which handles this internally

        console.log("Creating/updating blog post from Continuous:", {
          slug: blogPostData.slug,
          title: blogPostData.title,
        });

        // Note: In production, you'd want to:
        // 1. Check if post exists by external ID
        // 2. Update if exists, create if not
        // 3. Store the Continuous ID for future updates

        // For MVP, we'll respond with success and log
        // The actual Convex mutation would need the author ID which requires mapping

        return res.status(200).json({
          success: true,
          message: "Blog post data received",
          data: {
            slug: blogPostData.slug,
            title: blogPostData.title,
            // In production, return the created post ID
          },
        });
      }

      case "content.updated": {
        // Handle content updates
        console.log("Content update received:", payload.content.slug);
        return res.status(200).json({
          success: true,
          message: "Content update noted",
        });
      }

      case "content.unpublished": {
        // Handle content unpublishing (archive in nev.so)
        console.log("Content unpublish received:", payload.content.slug);
        return res.status(200).json({
          success: true,
          message: "Content unpublish noted",
        });
      }

      default:
        return res.status(400).json({
          error: `Unknown event type: ${payload.event}`,
        });
    }
  } catch (error) {
    console.error("Error processing Continuous webhook:", error);
    return res.status(500).json({
      error: "Failed to process webhook",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Map Continuous visibility to nev.so visibility
 */
function mapVisibility(visibility: "public" | "private" | "unlisted"): "public" | "members" | "tier1" | "tier2" {
  switch (visibility) {
    case "public":
      return "public";
    case "private":
      return "tier2"; // Most restrictive
    case "unlisted":
      return "members"; // Logged in users only
    default:
      return "public";
  }
}
