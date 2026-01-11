import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser, requireCreator } from "./auth";
import type { Id } from "./_generated/dataModel";

// Report categories matching schema
const REPORT_CATEGORIES = v.union(
  v.literal("content_quality"),
  v.literal("factual_error"),
  v.literal("dislike"),
  v.literal("infringement"),
  v.literal("contact_request"),
  v.literal("mention_removal"),
  v.literal("other")
);

/**
 * Create a content report for a blog post
 */
export const create = mutation({
  args: {
    postId: v.id("blogPosts"),
    category: REPORT_CATEGORIES,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post) {
      throw new Error("Post not found");
    }

    // Check if already reported by this user
    const existingReport = await ctx.db
      .query("contentReports")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("reporterId"), user._id))
      .unique();

    if (existingReport) {
      throw new Error("You have already reported this content");
    }

    const reportId = await ctx.db.insert("contentReports", {
      postId: args.postId,
      reporterId: user._id,
      category: args.category,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true, reportId };
  },
});

/**
 * Check if user has already reported a post
 */
export const hasReported = query({
  args: {
    postId: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existingReport = await ctx.db
      .query("contentReports")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("reporterId"), user._id))
      .unique();

    return !!existingReport;
  },
});

/**
 * Get content reports (admin only)
 */
export const getReports = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed"))),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    let reports = await ctx.db
      .query("contentReports")
      .withIndex("by_status")
      .order("desc")
      .collect();

    if (args.status) {
      reports = reports.filter((r) => r.status === args.status);
    }

    // Get post and reporter info
    const reportsWithInfo = await Promise.all(
      reports.map(async (report) => {
        const post = await ctx.db.get(report.postId);
        const reporter = await ctx.db.get(report.reporterId);

        return {
          ...report,
          post: post
            ? {
                _id: post._id,
                title: post.title,
                slug: post.slug,
                status: post.status,
              }
            : null,
          reporter: reporter
            ? {
                _id: reporter._id,
                displayName: reporter.displayName,
                username: reporter.username,
                avatarUrl: reporter.avatarUrl,
              }
            : null,
        };
      })
    );

    return reportsWithInfo;
  },
});

/**
 * Get report counts by status (admin only)
 */
export const getCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireCreator(ctx);

    const reports = await ctx.db.query("contentReports").collect();

    return {
      total: reports.length,
      pending: reports.filter((r) => r.status === "pending").length,
      reviewed: reports.filter((r) => r.status === "reviewed").length,
      dismissed: reports.filter((r) => r.status === "dismissed").length,
    };
  },
});

/**
 * Resolve a content report (admin only)
 */
export const resolve = mutation({
  args: {
    reportId: v.id("contentReports"),
    status: v.union(v.literal("reviewed"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    await ctx.db.patch(args.reportId, {
      status: args.status,
      resolvedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get category display info
 */
export const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  content_quality: {
    label: "Content/quality issue",
    description: "Typo, spelling mistake, or formatting problem",
  },
  factual_error: {
    label: "Major factual error",
    description: "Misreporting or misunderstanding of facts",
  },
  dislike: {
    label: "I don't like this content",
    description: "Personal preference or disagreement",
  },
  infringement: {
    label: "There's an infringement issue",
    description: "Copyright, trademark, or legal concern",
  },
  contact_request: {
    label: "I need to get in touch directly",
    description: "Want to discuss this content privately",
  },
  mention_removal: {
    label: "I'm mentioned and want to be removed",
    description: "Request to remove personal mention",
  },
  other: {
    label: "It's something else",
    description: "Other issue not listed above",
  },
};
