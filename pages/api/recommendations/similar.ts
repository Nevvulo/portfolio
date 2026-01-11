import type { NextApiRequest, NextApiResponse } from "next";
import { findSimilarArticles } from "../../../lib/upstash-vector";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, description, labels, currentSlug, excludeSlugs } = req.body;

  if (!title || !currentSlug) {
    return res.status(400).json({ error: "Missing title or currentSlug" });
  }

  try {
    const queryText = `${title}. ${description || ""}. ${(labels || []).join(" ")}`;

    // Fetch more results to have options after filtering
    const results = await findSimilarArticles(queryText, { topK: 10 });

    // Build exclusion set: current article + any previously viewed
    const excludeSet = new Set<string>([currentSlug]);
    if (Array.isArray(excludeSlugs)) {
      for (const slug of excludeSlugs) {
        excludeSet.add(slug);
      }
    }

    const filtered = results.filter((r) => !excludeSet.has(r.id)).slice(0, 2);

    return res.status(200).json({ similar: filtered });
  } catch (error) {
    console.error("[similar] Error:", error);
    return res.status(200).json({ similar: [] });
  }
}
