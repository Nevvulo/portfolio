import type { NextApiRequest, NextApiResponse } from "next";
import {
  type BlogPostContent,
  type BlogPostMetadata,
  blogIndex,
} from "../../../lib/upstash-search";

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  labels: string[];
  difficulty: string;
  contentType: string;
  coverImage: string;
  readTimeMins: number;
  publishedAt: number;
  authorName: string;
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | ErrorResponse>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { q, labels, limit = "10" } = req.query;

  // Either query or labels must be provided
  if (!q && !labels) {
    return res.status(400).json({ error: "Query parameter 'q' or 'labels' is required" });
  }

  try {
    const labelArray = labels
      ? (typeof labels === "string" ? labels.split(",") : labels)
          .map((l) => l.trim())
          .filter(Boolean)
      : undefined;

    const queryString = typeof q === "string" ? q.trim() : "";
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 50);

    // Build filter for labels - use CONTAINS for array fields
    // SECURITY: Escape single quotes to prevent filter injection
    let filter: string | undefined;
    if (labelArray && labelArray.length > 0) {
      filter = labelArray
        .map((label) => {
          // Escape single quotes by doubling them
          const escapedLabel = label.replace(/'/g, "''");
          return `labels CONTAINS '${escapedLabel}'`;
        })
        .join(" AND ");
    }

    // Use a default query if only filtering by labels
    const searchQuery = queryString || "article";

    const results = await blogIndex.search({
      query: searchQuery,
      limit: limitNum,
      filter,
    });

    const searchResults: SearchResult[] = results.map((r: any) => ({
      slug: r.metadata?.slug || r.id || "",
      title: r.content?.title || "",
      description: r.content?.description || "",
      labels: r.content?.labels || [],
      difficulty: r.metadata?.difficulty || "",
      contentType: r.metadata?.contentType || "",
      coverImage: r.metadata?.coverImage || "",
      readTimeMins: r.metadata?.readTimeMins || 0,
      publishedAt: r.metadata?.publishedAt || 0,
      authorName: r.metadata?.authorName || "",
      score: r.score || 0,
    }));

    return res.status(200).json({
      results: searchResults,
      total: searchResults.length,
    });
  } catch (error) {
    console.error("[search] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Search failed",
    });
  }
}
