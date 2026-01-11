import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get client IP from various headers (Vercel, Cloudflare, etc.) or socket
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    (req.headers["cf-connecting-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown";

  res.status(200).json({ ip });
}
