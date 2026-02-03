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
import type * as contentComments from "../contentComments.js";
import type * as contentHighlights from "../contentHighlights.js";
import type * as contentReactions from "../contentReactions.js";
import type * as contentReports from "../contentReports.js";
import type * as crons from "../crons.js";
import type * as discord from "../discord.js";
import type * as experience from "../experience.js";
import type * as featuredContent from "../featuredContent.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as lib_upstashPubsub from "../lib/upstashPubsub.js";
import type * as netvulo from "../netvulo.js";
import type * as notifications from "../notifications.js";
import type * as projects from "../projects.js";
import type * as recommendations from "../recommendations.js";
import type * as roblox from "../roblox.js";
import type * as roles from "../roles.js";
import type * as search from "../search.js";
import type * as software from "../software.js";
import type * as stream from "../stream.js";
import type * as supportAdmin from "../supportAdmin.js";
import type * as technologies from "../technologies.js";
import type * as userFeed from "../userFeed.js";
import type * as userProfiles from "../userProfiles.js";
import type * as users from "../users.js";
import type * as vault from "../vault.js";
import type * as widgetInteractions from "../widgetInteractions.js";
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
  contentComments: typeof contentComments;
  contentHighlights: typeof contentHighlights;
  contentReactions: typeof contentReactions;
  contentReports: typeof contentReports;
  crons: typeof crons;
  discord: typeof discord;
  experience: typeof experience;
  featuredContent: typeof featuredContent;
  http: typeof http;
  inventory: typeof inventory;
  "lib/upstashPubsub": typeof lib_upstashPubsub;
  netvulo: typeof netvulo;
  notifications: typeof notifications;
  projects: typeof projects;
  recommendations: typeof recommendations;
  roblox: typeof roblox;
  roles: typeof roles;
  search: typeof search;
  software: typeof software;
  stream: typeof stream;
  supportAdmin: typeof supportAdmin;
  technologies: typeof technologies;
  userFeed: typeof userFeed;
  userProfiles: typeof userProfiles;
  users: typeof users;
  vault: typeof vault;
  widgetInteractions: typeof widgetInteractions;
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
