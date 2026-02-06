/**
 * Health Check Endpoint
 *
 * Returns the health status of all external services.
 * Useful for monitoring, load balancers, and debugging.
 *
 * GET /api/health
 * GET /api/health?verbose=true (includes latency details)
 */

import { count } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { blogPosts } from "@/src/db/schema";
import {
  type HealthCheckResult,
  logger,
  runHealthCheck,
  withErrorHandling,
} from "../../lib/observability";

const getRedisClient = async () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const verbose = req.query.verbose === "true";
  const startTime = Date.now();

  const result = await runHealthCheck([
    // Postgres Database
    {
      name: "postgres",
      check: async () => {
        if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not configured");
        // Simple query to verify connection
        await db.select({ total: count() }).from(blogPosts);
      },
    },

    // Upstash Redis
    {
      name: "redis",
      check: async () => {
        const redis = await getRedisClient();
        if (!redis) throw new Error("Redis not configured");
        const response = await fetch(`${redis.url}/ping`, {
          headers: { Authorization: `Bearer ${redis.token}` },
        });
        if (!response.ok) throw new Error(`Redis ping failed: ${response.status}`);
      },
    },

    // Clerk (check if keys are configured)
    {
      name: "clerk",
      check: async () => {
        if (!process.env.CLERK_SECRET_KEY) {
          throw new Error("Clerk secret key not configured");
        }
        // Verify key format
        if (!process.env.CLERK_SECRET_KEY.startsWith("sk_")) {
          throw new Error("Invalid Clerk secret key format");
        }
      },
    },

    // Discord Bot Token
    {
      name: "discord",
      check: async () => {
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) throw new Error("Discord bot token not configured");
        // Verify token by checking current user
        const response = await fetch("https://discord.com/api/v10/users/@me", {
          headers: { Authorization: `Bot ${token}` },
        });
        if (!response.ok) throw new Error(`Discord API failed: ${response.status}`);
      },
    },

    // Vercel Blob Storage
    {
      name: "blob-storage",
      check: async () => {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new Error("Blob storage token not configured");
        }
      },
    },

    // YouTube API
    {
      name: "youtube",
      check: async () => {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) throw new Error("YouTube API key not configured");
        // Quick quota-free check
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=id&id=dQw4w9WgXcQ&key=${apiKey}`,
        );
        if (!response.ok) throw new Error(`YouTube API failed: ${response.status}`);
      },
    },
  ]);

  // Log health check results
  logger.info("Health check completed", {
    status: result.status,
    duration: `${Date.now() - startTime}ms`,
    failedChecks: result.checks.filter((c) => c.status === "fail").map((c) => c.name),
  });

  // Determine HTTP status code
  const statusCode = result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503;

  // Return response
  const response: HealthCheckResult & { version?: string; uptime?: number } = {
    ...result,
    ...(verbose && {
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
      uptime: process.uptime(),
    }),
  };

  // Remove latency details if not verbose
  if (!verbose) {
    response.checks = response.checks.map(({ name, status, message }) => ({
      name,
      status,
      message,
    }));
  }

  res.status(statusCode).json(response);
}

export default withErrorHandling(handler, { logAllRequests: true });
