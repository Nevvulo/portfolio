import { getAuth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import type { NextApiRequest, NextApiResponse } from "next";

// Config for Next.js API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface UploadResponse {
  url: string;
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\]/g, "")
    .replace(/\0/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .slice(0, 100);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { file, filename: originalFilename } = req.body;

    if (!file || !originalFilename) {
      return res.status(400).json({ error: "Missing file or filename" });
    }

    // Parse base64 file
    const matches = file.match(/^data:([A-Za-z0-9\-+/.]+);base64,([\s\S]+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid file format. Expected base64 data URL." });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Validate mime type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WebP, GIF`,
      });
    }

    const fileBuffer = Buffer.from(base64Data, "base64");

    // Check file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: "File too large. Maximum size is 10MB.",
      });
    }

    // Generate unique filename
    const sanitizedFilename = sanitizeFilename(originalFilename);
    const timestamp = Date.now();
    const extension = mimeType.split("/")[1] || "png";
    const uniqueFilename = `${timestamp}-${sanitizedFilename}.${extension}`;
    const filepath = `blog/images/${uniqueFilename}`;

    // Upload to Vercel Blob
    const blob = await put(filepath, fileBuffer, {
      access: "public",
      contentType: mimeType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to upload file",
    });
  }
}
