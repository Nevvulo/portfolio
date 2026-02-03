import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";
import { getAuth } from "@clerk/nextjs/server";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const filename = req.headers["x-filename"] as string;
  if (!filename) {
    return res.status(400).json({ error: "Missing x-filename header" });
  }

  const contentType = req.headers["content-type"] ?? "image/png";
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(contentType)) {
    return res.status(400).json({ error: "Invalid file type. Must be PNG, JPEG, or WebP." });
  }

  try {
    const blob = await put(`backgrounds/${filename}`, req, {
      access: "public",
      contentType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("Upload failed:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
}
