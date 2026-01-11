import { getAuth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "16kb",
    },
  },
};

interface ModerationResult {
  score: number; // 0 (safe) to 1 (harmful)
  flags: string[];
  summary: string;
  action: "allow" | "review" | "block";
}

interface ModerationRequest {
  content: string;
  context?: {
    type: "feed_post" | "comment" | "message";
    authorId?: string;
    previousViolations?: number;
  };
}

const SYSTEM_PROMPT = `You are a content moderation assistant. Analyze the following content and return a JSON object with:
- score: A number from 0 to 1 where 0 is completely safe and 1 is severely harmful
- flags: An array of concern categories found (e.g., "spam", "harassment", "hate_speech", "violence", "adult_content", "self_harm", "misinformation", "personal_info")
- summary: A brief explanation of your assessment (max 100 chars)
- action: One of "allow" (score < 0.3), "review" (0.3 <= score < 0.7), or "block" (score >= 0.7)

Guidelines:
- Consider context: casual profanity in a chat is different from targeted harassment
- Be lenient with legitimate criticism, opinions, and humor
- Flag content that could cause real-world harm or targets individuals
- Return valid JSON only, no markdown or extra text

Examples of scores:
- "Hello everyone!" -> 0.0 (safe)
- "That's a stupid idea" -> 0.1 (mild negativity, ok)
- "You're such an idiot" -> 0.35 (personal attack, needs review)
- "[slurs or hate speech]" -> 0.9+ (harmful, block)`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ModerationResult | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify auth - only internal calls or authenticated users
  const { userId } = getAuth(req);
  const internalKey = req.headers["x-internal-key"];

  if (!userId && internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { content, context } = req.body as ModerationRequest;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }

    // Truncate content to prevent token abuse
    const truncatedContent = content.slice(0, 2000);

    // Build context string
    let contextInfo = "";
    if (context) {
      contextInfo = `\n\nContext: This is a ${context.type}.`;
      if (context.previousViolations && context.previousViolations > 0) {
        contextInfo += ` The author has ${context.previousViolations} previous violation(s).`;
      }
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      prompt: `Analyze this content:${contextInfo}\n\n"${truncatedContent}"`,
      temperature: 0.1,
    });

    // Parse the response
    let result: ModerationResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      result = JSON.parse(jsonMatch[0]);

      // Validate and clamp score
      result.score = Math.max(0, Math.min(1, result.score || 0));
      result.flags = Array.isArray(result.flags) ? result.flags : [];
      result.summary = String(result.summary || "").slice(0, 150);

      // Ensure action matches score
      if (result.score < 0.3) {
        result.action = "allow";
      } else if (result.score < 0.7) {
        result.action = "review";
      } else {
        result.action = "block";
      }
    } catch (parseError) {
      console.error("Failed to parse moderation response:", text);
      // Default to safe if parsing fails
      result = {
        score: 0,
        flags: [],
        summary: "Unable to analyze content",
        action: "allow",
      };
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Moderation error:", error);

    // On AI error, default to allowing content (fail open)
    // but flag for manual review
    return res.status(200).json({
      score: 0.35,
      flags: ["ai_error"],
      summary: "AI moderation unavailable, flagged for manual review",
      action: "review",
    });
  }
}
