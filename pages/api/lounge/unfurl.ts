import { lookup } from "dns/promises";
import type { NextApiRequest, NextApiResponse } from "next";
import type { EmbedType } from "../../../types/lounge";

export const config = {
  api: {
    bodyParser: true,
  },
};

interface UnfurlResponse {
  type: EmbedType;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  siteName?: string;
  embedUrl?: string;
}

/**
 * SECURITY: Check if an IP address is private/internal
 * Blocks SSRF attacks against internal networks and cloud metadata
 */
function isPrivateIp(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    // IPv6 or invalid - be conservative and block
    return true;
  }

  const [a, b] = parts;

  // Localhost: 127.0.0.0/8
  if (a === 127) return true;

  // Private: 10.0.0.0/8
  if (a === 10) return true;

  // Private: 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;

  // Private: 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  // Link-local: 169.254.0.0/16 (includes AWS metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // Loopback: 0.0.0.0
  if (a === 0) return true;

  return false;
}

/**
 * SECURITY: Check if hostname is safe to fetch (not internal)
 */
async function isHostnameSafe(hostname: string): Promise<boolean> {
  // Block obvious internal hostnames
  const internalPatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /\.local$/i,
    /\.internal$/i,
    /\.localhost$/i,
  ];

  for (const pattern of internalPatterns) {
    if (pattern.test(hostname)) {
      return false;
    }
  }

  // Resolve hostname to IP and check if it's private
  try {
    const { address } = await lookup(hostname);
    if (isPrivateIp(address)) {
      return false;
    }
  } catch {
    // DNS resolution failed - could be trying to access something weird
    // Be conservative and block
    return false;
  }

  return true;
}

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

function extractYouTubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtu.be" ||
      parsed.hostname === "m.youtube.com"
    );
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnfurlResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    // Only allow http and https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: "Only HTTP/HTTPS URLs are supported" });
    }

    // SECURITY: Block SSRF attacks against internal networks
    const isSafe = await isHostnameSafe(parsedUrl.hostname);
    if (!isSafe) {
      return res.status(400).json({ error: "URL not allowed" });
    }

    // Check for YouTube
    if (isYouTubeUrl(url)) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        return res.status(200).json({
          type: "youtube",
          url,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          siteName: "YouTube",
        });
      }
    }

    // Fetch the page to extract Open Graph metadata
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; UnfurlBot/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(200).json({
          type: "link",
          url,
          siteName: parsedUrl.hostname,
        });
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return res.status(200).json({
          type: "link",
          url,
          siteName: parsedUrl.hostname,
        });
      }

      const html = await response.text();

      // Extract Open Graph and meta tags
      const metadata = extractMetadata(html);

      return res.status(200).json({
        type: "link",
        url,
        title: metadata.title,
        description: metadata.description,
        thumbnail: metadata.image ? resolveUrl(metadata.image, url) : undefined,
        siteName: metadata.siteName || parsedUrl.hostname,
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      // Return basic link info if fetch fails
      return res.status(200).json({
        type: "link",
        url,
        siteName: parsedUrl.hostname,
      });
    }
  } catch (error) {
    console.error("Unfurl error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to unfurl URL",
    });
  }
}

interface Metadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

function extractMetadata(html: string): Metadata {
  const metadata: Metadata = {};

  // Extract OG tags
  const ogTitle =
    extractMetaContent(html, 'property="og:title"') ||
    extractMetaContent(html, "property='og:title'");
  const ogDescription =
    extractMetaContent(html, 'property="og:description"') ||
    extractMetaContent(html, "property='og:description'");
  const ogImage =
    extractMetaContent(html, 'property="og:image"') ||
    extractMetaContent(html, "property='og:image'");
  const ogSiteName =
    extractMetaContent(html, 'property="og:site_name"') ||
    extractMetaContent(html, "property='og:site_name'");

  // Extract Twitter card tags as fallback
  const twitterTitle =
    extractMetaContent(html, 'name="twitter:title"') ||
    extractMetaContent(html, "name='twitter:title'");
  const twitterDescription =
    extractMetaContent(html, 'name="twitter:description"') ||
    extractMetaContent(html, "name='twitter:description'");
  const twitterImage =
    extractMetaContent(html, 'name="twitter:image"') ||
    extractMetaContent(html, "name='twitter:image'");

  // Extract standard meta tags as fallback
  const metaDescription =
    extractMetaContent(html, 'name="description"') ||
    extractMetaContent(html, "name='description'");

  // Extract title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch?.[1]?.trim();

  // Use OG first, then Twitter, then standard
  metadata.title = ogTitle || twitterTitle || pageTitle;
  metadata.description = ogDescription || twitterDescription || metaDescription;
  metadata.image = ogImage || twitterImage;
  metadata.siteName = ogSiteName;

  // Clean up
  if (metadata.title) {
    metadata.title = decodeHtmlEntities(metadata.title).slice(0, 200);
  }
  if (metadata.description) {
    metadata.description = decodeHtmlEntities(metadata.description).slice(0, 300);
  }

  return metadata;
}

function extractMetaContent(html: string, attribute: string): string | undefined {
  // Match meta tag with the given attribute
  const regex = new RegExp(
    `<meta[^>]+${attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]+content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(regex);
  if (match?.[1]) return match[1];

  // Also try with content before the attribute
  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "i",
  );
  const match2 = html.match(regex2);
  return match2?.[1];
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

function resolveUrl(imageUrl: string, baseUrl: string): string {
  try {
    // If it's already an absolute URL, return as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    // Resolve relative URL
    return new URL(imageUrl, baseUrl).href;
  } catch {
    return imageUrl;
  }
}
