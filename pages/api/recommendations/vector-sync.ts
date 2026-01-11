import type { NextApiRequest, NextApiResponse } from "next";
import { deleteArticleEmbedding, upsertArticleWithEmbedding } from "../../../lib/upstash-vector";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, slug, title, description, labels, difficulty, contentType, publishedAt } =
    req.body;

  if (!slug) {
    return res.status(400).json({ error: "Missing slug" });
  }

  try {
    if (action === "delete") {
      await deleteArticleEmbedding(slug);
      return res.status(200).json({ success: true, action: "deleted" });
    }

    if (!title) {
      return res.status(400).json({ error: "Missing title for upsert" });
    }

    const textToEmbed = `${title}. ${description || ""}. Topics: ${(labels || []).join(", ")}`;

    await upsertArticleWithEmbedding(slug, textToEmbed, {
      slug,
      title,
      labels: labels || [],
      difficulty: difficulty || "beginner",
      contentType: contentType || "article",
      publishedAt: publishedAt || Date.now(),
    });

    return res.status(200).json({ success: true, action: "upserted" });
  } catch (error) {
    console.error("[vector-sync] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
