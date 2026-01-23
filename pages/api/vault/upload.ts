import { getAuth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import type { NextApiRequest, NextApiResponse } from "next";

// Config for Next.js API route - support large files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "150mb", // Support videos up to 100MB + overhead
    },
  },
};

// File type configurations with max sizes
const FILE_TYPE_CONFIG = {
  pdf: {
    maxSize: 50 * 1024 * 1024, // 50MB
    mimeTypes: ["application/pdf"],
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"],
  },
  document: {
    maxSize: 25 * 1024 * 1024, // 25MB
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/markdown",
      "application/rtf",
    ],
  },
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  },
  archive: {
    maxSize: 100 * 1024 * 1024, // 100MB
    mimeTypes: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/gzip",
    ],
  },
};

// Map MIME type to file type category
function getFileType(mimeType: string): keyof typeof FILE_TYPE_CONFIG | null {
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.mimeTypes.includes(mimeType)) {
      return type as keyof typeof FILE_TYPE_CONFIG;
    }
  }
  return null;
}

// Get all allowed MIME types
const ALL_ALLOWED_TYPES = Object.values(FILE_TYPE_CONFIG).flatMap((c) => c.mimeTypes);

interface UploadResponse {
  url: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  fileType: keyof typeof FILE_TYPE_CONFIG;
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

  // For now, allow any authenticated user to upload (creator check in Convex)
  // The Convex mutation enforces creator-only access

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
    if (!ALL_ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: `Unsupported file type: ${mimeType}. Allowed: PDFs, videos, documents, images, and archives.`,
      });
    }

    const fileType = getFileType(mimeType);
    if (!fileType) {
      return res.status(400).json({ error: "Could not determine file type" });
    }

    const fileBuffer = Buffer.from(base64Data, "base64");
    const maxSize = FILE_TYPE_CONFIG[fileType].maxSize;

    // Check file size
    if (fileBuffer.length > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return res.status(400).json({
        error: `File too large. Maximum size for ${fileType} files is ${maxSizeMB}MB.`,
      });
    }

    // Generate unique filename
    const sanitizedFilename = sanitizeFilename(originalFilename);
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    const filepath = `vault/${fileType}/${uniqueFilename}`;

    // Upload to Vercel Blob
    const blob = await put(filepath, fileBuffer, {
      access: "public",
      contentType: mimeType,
    });

    return res.status(200).json({
      url: blob.url,
      filename: originalFilename,
      mimeType,
      fileSize: fileBuffer.length,
      fileType,
    });
  } catch (error) {
    console.error("Vault upload error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to upload file",
    });
  }
}
