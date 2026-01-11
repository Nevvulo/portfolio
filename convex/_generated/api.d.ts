/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as articleWatchTime from "../articleWatchTime.js";
import type * as auth from "../auth.js";
import type * as blogAnalytics from "../blogAnalytics.js";
import type * as blogCommentReactions from "../blogCommentReactions.js";
import type * as blogComments from "../blogComments.js";
import type * as blogDiscord from "../blogDiscord.js";
import type * as blogMigration from "../blogMigration.js";
import type * as blogPosts from "../blogPosts.js";
import type * as blogReactions from "../blogReactions.js";
import type * as blogViews from "../blogViews.js";
import type * as cache from "../cache.js";
import type * as channels from "../channels.js";
import type * as contentComments from "../contentComments.js";
import type * as contentHighlights from "../contentHighlights.js";
import type * as contentPosts from "../contentPosts.js";
import type * as contentReactions from "../contentReactions.js";
import type * as contentReports from "../contentReports.js";
import type * as crons from "../crons.js";
import type * as discord from "../discord.js";
import type * as experience from "../experience.js";
import type * as jungle from "../jungle.js";
import type * as lib_upstashPubsub from "../lib/upstashPubsub.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as presence from "../presence.js";
import type * as projects from "../projects.js";
import type * as recommendations from "../recommendations.js";
import type * as rewards from "../rewards.js";
import type * as roles from "../roles.js";
import type * as search from "../search.js";
import type * as technologies from "../technologies.js";
import type * as userFeed from "../userFeed.js";
import type * as userProfiles from "../userProfiles.js";
import type * as users from "../users.js";
import type * as youtube from "../youtube.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  articleWatchTime: typeof articleWatchTime;
  auth: typeof auth;
  blogAnalytics: typeof blogAnalytics;
  blogCommentReactions: typeof blogCommentReactions;
  blogComments: typeof blogComments;
  blogDiscord: typeof blogDiscord;
  blogMigration: typeof blogMigration;
  blogPosts: typeof blogPosts;
  blogReactions: typeof blogReactions;
  blogViews: typeof blogViews;
  cache: typeof cache;
  channels: typeof channels;
  contentComments: typeof contentComments;
  contentHighlights: typeof contentHighlights;
  contentPosts: typeof contentPosts;
  contentReactions: typeof contentReactions;
  contentReports: typeof contentReports;
  crons: typeof crons;
  discord: typeof discord;
  experience: typeof experience;
  jungle: typeof jungle;
  "lib/upstashPubsub": typeof lib_upstashPubsub;
  messages: typeof messages;
  notifications: typeof notifications;
  presence: typeof presence;
  projects: typeof projects;
  recommendations: typeof recommendations;
  rewards: typeof rewards;
  roles: typeof roles;
  search: typeof search;
  technologies: typeof technologies;
  userFeed: typeof userFeed;
  userProfiles: typeof userProfiles;
  users: typeof users;
  youtube: typeof youtube;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
