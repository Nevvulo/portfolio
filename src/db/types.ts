/**
 * Shared types inferred from Drizzle schema.
 * Use these instead of Convex Doc<"tableName"> types.
 */
import type { InferSelectModel } from "drizzle-orm";
import type {
  blogComments,
  blogPosts,
  blogReactions,
  projects,
  roles,
  software,
  technologies,
  users,
} from "./schema";

export type User = InferSelectModel<typeof users>;
export type BlogPost = InferSelectModel<typeof blogPosts>;
export type BlogComment = InferSelectModel<typeof blogComments>;
export type BlogReaction = InferSelectModel<typeof blogReactions>;
export type Project = InferSelectModel<typeof projects>;
export type Software = InferSelectModel<typeof software>;
export type Technology = InferSelectModel<typeof technologies>;
export type Role = InferSelectModel<typeof roles>;
