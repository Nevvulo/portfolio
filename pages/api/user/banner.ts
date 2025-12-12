import { getAuth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Config for Next.js API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

// Max dimensions for banner
const MAX_WIDTH = 960;
const MAX_HEIGHT = 200;
const QUALITY = 85;

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST for upload, DELETE for removal
  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check auth
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "DELETE") {
      // Remove banner
      // Get current banner URL from Convex to delete from Blob
      const token = await getAuth(req).getToken({ template: "convex" });
      if (token) {
        convex.setAuth(token);
      }

      // Call mutation to clear banner
      await convex.mutation(api.userProfiles.removeBanner);

      return res.status(200).json({ success: true });
    }

    // POST - Upload new banner
    const { image, focalY } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Validate focalY
    const focalYValue = typeof focalY === "number" ? focalY : 50;
    if (focalYValue < 0 || focalYValue > 100) {
      return res.status(400).json({ error: "Focal Y must be between 0 and 100" });
    }

    // Parse base64 image
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Validate mime type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: "Invalid image type. Allowed: JPEG, PNG, WebP, GIF",
      });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Check file size (max 4MB after decode)
    if (imageBuffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large. Max 4MB." });
    }

    // Process image with Sharp
    const processedBuffer = await sharp(imageBuffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: QUALITY })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `banners/${userId}/${timestamp}.webp`;

    // Upload to Vercel Blob
    const blob = await put(filename, processedBuffer, {
      access: "public",
      contentType: "image/webp",
    });

    // Update Convex with new banner URL
    const token = await getAuth(req).getToken({ template: "convex" });
    if (token) {
      convex.setAuth(token);
    }

    await convex.mutation(api.userProfiles.updateBanner, {
      bannerUrl: blob.url,
      bannerFocalY: focalYValue,
    });

    return res.status(200).json({
      url: blob.url,
      focalY: focalYValue,
    });
  } catch (error) {
    console.error("Banner upload error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to upload banner",
    });
  }
}
