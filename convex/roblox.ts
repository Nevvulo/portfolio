import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Generate a random verification code
function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars (0/O, 1/I/L)
  let code = "NV-"; // Prefix to identify it's for Nevulo
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Start Roblox verification process
export const startVerification = mutation({
  args: {
    robloxUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const clerkId = identity.subject;

    // Check if user already has Roblox linked
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (user?.robloxUserId) {
      throw new Error("Roblox account already linked. Unlink first to link a different account.");
    }

    // Cancel any existing pending verifications
    const existingPending = await ctx.db
      .query("robloxVerifications")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId).eq("status", "pending"))
      .collect();

    for (const pending of existingPending) {
      await ctx.db.patch(pending._id, { status: "expired" });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes

    // Create verification record (robloxUserId will be populated by the action)
    const verificationId = await ctx.db.insert("robloxVerifications", {
      clerkId,
      robloxUserId: "", // Will be populated when we look up the user
      robloxUsername: args.robloxUsername,
      verificationCode,
      status: "pending",
      createdAt: now,
      expiresAt,
    });

    return {
      verificationId,
      verificationCode,
      expiresAt,
      instructions: `Add this code to your Roblox profile description: ${verificationCode}`,
    };
  },
});

// Internal mutation to update verification with Roblox user ID
export const updateVerificationRobloxId = internalMutation({
  args: {
    verificationId: v.id("robloxVerifications"),
    robloxUserId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.verificationId, {
      robloxUserId: args.robloxUserId,
    });
  },
});

// Internal mutation to complete verification
export const completeVerification = internalMutation({
  args: {
    verificationId: v.id("robloxVerifications"),
    robloxUserId: v.string(),
    robloxUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const verification = await ctx.db.get(args.verificationId);
    if (!verification) throw new Error("Verification not found");
    if (verification.status !== "pending") throw new Error("Verification already processed");

    // Check if this Roblox account is already linked to someone else
    const existingLink = await ctx.db
      .query("users")
      .withIndex("by_robloxUserId", (q) => q.eq("robloxUserId", args.robloxUserId))
      .first();

    if (existingLink && existingLink.clerkId !== verification.clerkId) {
      await ctx.db.patch(args.verificationId, { status: "failed" });
      throw new Error("This Roblox account is already linked to another user");
    }

    // Update verification status
    await ctx.db.patch(args.verificationId, {
      status: "verified",
      verifiedAt: Date.now(),
      robloxUserId: args.robloxUserId,
    });

    // Update user with Roblox info
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", verification.clerkId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        robloxUserId: args.robloxUserId,
        robloxUsername: args.robloxUsername,
        robloxVerifiedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Internal mutation to fail verification
export const failVerification = internalMutation({
  args: {
    verificationId: v.id("robloxVerifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.verificationId, { status: "failed" });
  },
});

// Check verification status (action that calls Roblox API)
export const checkVerification = action({
  args: {
    verificationId: v.id("robloxVerifications"),
  },
  handler: async (ctx, args): Promise<{
    status: string;
    message: string;
    robloxUserId?: string;
    robloxUsername?: string;
  }> => {
    // Get the verification record
    const verification = await ctx.runQuery(internal.roblox.getVerification, {
      verificationId: args.verificationId,
    }) as {
      status: string;
      expiresAt: number;
      robloxUsername: string;
      robloxUserId: string;
      verificationCode: string;
    } | null;

    if (!verification) {
      throw new Error("Verification not found");
    }

    if (verification.status !== "pending") {
      return { status: verification.status, message: "Verification already processed" };
    }

    if (Date.now() > verification.expiresAt) {
      await ctx.runMutation(internal.roblox.failVerification, {
        verificationId: args.verificationId,
      });
      return { status: "expired", message: "Verification expired" };
    }

    // Look up Roblox user by username
    const userLookupResponse = await fetch(
      `https://users.roblox.com/v1/usernames/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [verification.robloxUsername],
          excludeBannedUsers: true,
        }),
      }
    );

    if (!userLookupResponse.ok) {
      throw new Error("Failed to look up Roblox user");
    }

    const userLookup = await userLookupResponse.json();
    const robloxUser = userLookup.data?.[0];

    if (!robloxUser) {
      return { status: "pending", message: "Roblox user not found. Check the username." };
    }

    const robloxUserId = String(robloxUser.id);
    const robloxUsername = robloxUser.name;

    // Update verification with Roblox user ID if not set
    if (!verification.robloxUserId) {
      await ctx.runMutation(internal.roblox.updateVerificationRobloxId, {
        verificationId: args.verificationId,
        robloxUserId,
      });
    }

    // Fetch user's profile to check description
    const profileResponse = await fetch(
      `https://users.roblox.com/v1/users/${robloxUserId}`
    );

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch Roblox profile");
    }

    const profile = await profileResponse.json();
    const description = profile.description || "";

    // Check if verification code is in profile description
    if (description.includes(verification.verificationCode)) {
      // Success! Complete the verification
      await ctx.runMutation(internal.roblox.completeVerification, {
        verificationId: args.verificationId,
        robloxUserId,
        robloxUsername,
      });

      return {
        status: "verified",
        message: "Roblox account verified successfully!",
        robloxUserId,
        robloxUsername,
      };
    }

    return {
      status: "pending",
      message: `Verification code not found in profile. Make sure "${verification.verificationCode}" is in your Roblox profile description.`,
    };
  },
});

// Internal query to get verification
export const getVerification = internalQuery({
  args: {
    verificationId: v.id("robloxVerifications"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.verificationId);
  },
});

// Get current user's pending verification
export const getPendingVerification = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const pending = await ctx.db
      .query("robloxVerifications")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject).eq("status", "pending"))
      .first();

    if (!pending) return null;

    // Check if expired
    if (Date.now() > pending.expiresAt) {
      return null;
    }

    return pending;
  },
});

// Unlink Roblox account
export const unlinkRoblox = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      robloxUserId: undefined,
      robloxUsername: undefined,
      robloxVerifiedAt: undefined,
    });

    return { success: true };
  },
});

// Get user's linked Roblox account
export const getLinkedRoblox = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.robloxUserId) return null;

    return {
      robloxUserId: user.robloxUserId,
      robloxUsername: user.robloxUsername,
      verifiedAt: user.robloxVerifiedAt,
    };
  },
});

// ============================================
// API for external services (Netvulo/GolfQuest)
// ============================================

// Get subscription status by Roblox user ID (for Netvulo HTTP endpoint)
export const getSubscriptionByRobloxId = query({
  args: {
    robloxUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_robloxUserId", (q) => q.eq("robloxUserId", args.robloxUserId))
      .first();

    if (!user) {
      return {
        linked: false,
        robloxUserId: args.robloxUserId,
        subscription: null,
      };
    }

    return {
      linked: true,
      robloxUserId: args.robloxUserId,
      robloxUsername: user.robloxUsername,
      clerkId: user.clerkId,
      subscription: {
        tier: user.tier,
        clerkPlan: user.clerkPlan,
        clerkPlanStatus: user.clerkPlanStatus,
        isSuperLegend: user.tier === "tier1" || user.tier === "tier2",
        isSuperLegend2: user.tier === "tier2",
        founderNumber: user.founderNumber,
        discordBooster: user.discordBooster,
        twitchSubTier: user.twitchSubTier,
      },
    };
  },
});
