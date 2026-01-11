import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";

// Config for Next.js API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
  maxDuration: 30, // 30 second timeout for sandbox execution
};

interface SandboxResponse {
  stdout: string;
  stderr: string;
}

interface SandboxErrorResponse {
  error: string;
}

const SUPPORTED_LANGUAGES = ["javascript", "typescript", "python"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SandboxResponse | SandboxErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { code, language } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Missing or invalid code" });
    }

    if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        error: `Unsupported language. Allowed: ${SUPPORTED_LANGUAGES.join(", ")}`,
      });
    }

    // Code length limit
    if (code.length > 50000) {
      return res.status(400).json({ error: "Code too long. Maximum 50,000 characters." });
    }

    // Import Vercel SDK dynamically
    const { Vercel } = await import("@vercel/sdk");

    const vercel = new Vercel({
      bearerToken: process.env.VERCEL_TOKEN,
    });

    // Determine file extension and run command
    let filename: string;
    let runCommand: string;

    switch (language) {
      case "javascript":
        filename = "index.js";
        runCommand = "node index.js";
        break;
      case "typescript":
        filename = "index.ts";
        runCommand = "bun index.ts";
        break;
      case "python":
        filename = "main.py";
        runCommand = "python3 main.py";
        break;
      default:
        filename = "index.js";
        runCommand = "node index.js";
    }

    // Create sandbox and run code
    const sandbox = await vercel.sandbox.create({
      projectId: process.env.VERCEL_PROJECT_ID,
      teamId: process.env.VERCEL_TEAM_ID,
    });

    // Write code to file
    await vercel.sandbox.files.write(sandbox.sandboxId, {
      path: filename,
      data: code,
    });

    // Execute the code
    const result = await vercel.sandbox.exec(sandbox.sandboxId, {
      cmd: [runCommand.split(" ")[0], ...runCommand.split(" ").slice(1)],
    });

    // Stop the sandbox
    await vercel.sandbox.stop(sandbox.sandboxId);

    return res.status(200).json({
      stdout: result.stdout || "",
      stderr: result.stderr || "",
    });
  } catch (error) {
    console.error("Sandbox error:", error);

    // Return a more helpful error message
    if (error instanceof Error) {
      // Check for common errors
      if (error.message.includes("VERCEL_TOKEN")) {
        return res.status(500).json({ error: "Sandbox not configured. Please set VERCEL_TOKEN." });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: "Failed to execute code" });
  }
}
