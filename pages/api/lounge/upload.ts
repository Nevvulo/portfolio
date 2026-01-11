import { getAuth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import type { NextApiRequest, NextApiResponse } from "next";
import type { EmbedType } from "../../../types/lounge";

// Config for Next.js API route - larger limit for video
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

// File type configurations
const FILE_CONFIGS = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    folder: "lounge/images",
  },
  video: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
    folder: "lounge/videos",
  },
  audio: {
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"],
    folder: "lounge/audio",
  },
} as const;

type FileCategory = keyof typeof FILE_CONFIGS;

interface UploadResponse {
  url: string;
  type: EmbedType;
  filename: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
}

function getFileCategory(mimeType: string): FileCategory | null {
  for (const [category, config] of Object.entries(FILE_CONFIGS)) {
    if ((config.allowedTypes as readonly string[]).includes(mimeType)) {
      return category as FileCategory;
    }
  }
  return null;
}

function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes, keep alphanumeric, dots, hyphens, underscores
  return filename
    .replace(/[/\\]/g, "")
    .replace(/\0/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .slice(0, 100); // Limit length
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | { error: string }>,
) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check auth
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { file, filename: originalFilename, mimeType } = req.body;

    if (!file || !originalFilename || !mimeType) {
      return res.status(400).json({ error: "Missing file, filename, or mimeType" });
    }

    // Determine file category
    const category = getFileCategory(mimeType);
    if (!category) {
      return res.status(400).json({
        error: `Unsupported file type: ${mimeType}. Allowed: images (JPEG, PNG, WebP, GIF), videos (MP4, WebM), audio (MP3, WAV, OGG)`,
      });
    }

    const config = FILE_CONFIGS[category];

    // Parse base64 file - handle various MIME type formats
    // Use [\s\S]* instead of .* with 's' flag for cross-line matching
    const matches = file.match(/^data:([A-Za-z0-9\-+/.]+);base64,([\s\S]+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid file format. Expected base64 data URL." });
    }

    const base64Data = matches[2];
    const fileBuffer = Buffer.from(base64Data, "base64");

    // Check file size
    if (fileBuffer.length > config.maxSize) {
      const maxMB = config.maxSize / (1024 * 1024);
      return res.status(400).json({
        error: `File too large. Maximum size for ${category} is ${maxMB}MB.`,
      });
    }

    // Sanitize filename and generate unique path
    const sanitizedFilename = sanitizeFilename(originalFilename);
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    const filepath = `${config.folder}/${userId}/${uniqueFilename}`;

    // Upload to Vercel Blob - NO processing, preserve original (important for GIFs)
    const blob = await put(filepath, fileBuffer, {
      access: "public",
      contentType: mimeType,
    });

    // Build response
    const response: UploadResponse = {
      url: blob.url,
      type: category as EmbedType,
      filename: originalFilename,
      mimeType,
      fileSize: fileBuffer.length,
    };

    // For images, try to extract dimensions from the buffer
    // This is a simple approach - for production you might want to use sharp or similar
    if (category === "image") {
      const dimensions = getImageDimensions(fileBuffer, mimeType);
      if (dimensions) {
        response.width = dimensions.width;
        response.height = dimensions.height;
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to upload file",
    });
  }
}

// Simple image dimension extraction without external dependencies
// Works for JPEG, PNG, GIF, WebP
function getImageDimensions(
  buffer: Buffer,
  mimeType: string,
): { width: number; height: number } | null {
  try {
    if (mimeType === "image/png") {
      // PNG: width at bytes 16-19, height at bytes 20-23 (big endian)
      if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20),
        };
      }
    } else if (mimeType === "image/gif") {
      // GIF: width at bytes 6-7, height at bytes 8-9 (little endian)
      if (buffer.length >= 10 && buffer[0] === 0x47 && buffer[1] === 0x49) {
        return {
          width: buffer.readUInt16LE(6),
          height: buffer.readUInt16LE(8),
        };
      }
    } else if (mimeType === "image/jpeg") {
      // JPEG: Need to parse SOF markers
      return parseJpegDimensions(buffer);
    } else if (mimeType === "image/webp") {
      // WebP: Check for VP8/VP8L/VP8X chunk
      if (buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF") {
        const format = buffer.toString("ascii", 12, 16);
        if (format === "VP8 " && buffer.length >= 30) {
          // Lossy WebP
          return {
            width: buffer.readUInt16LE(26) & 0x3fff,
            height: buffer.readUInt16LE(28) & 0x3fff,
          };
        } else if (format === "VP8L" && buffer.length >= 25) {
          // Lossless WebP
          const bits = buffer.readUInt32LE(21);
          return {
            width: (bits & 0x3fff) + 1,
            height: ((bits >> 14) & 0x3fff) + 1,
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  // JPEG dimensions are in SOF markers (0xFFC0-0xFFC3)
  let offset = 2; // Skip SOI marker
  while (offset < buffer.length - 8) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === undefined) {
      offset++;
      continue;
    }
    // SOF markers: 0xC0-0xC3, 0xC5-0xC7, 0xC9-0xCB, 0xCD-0xCF
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    // Skip to next marker
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
    } else if (marker >= 0xd0 && marker <= 0xd7) {
      offset += 2;
    } else {
      const length = buffer.readUInt16BE(offset + 2);
      offset += 2 + length;
    }
  }
  return null;
}
