/**
 * Export all Convex tables to JSON files for migration to Postgres.
 *
 * Usage:
 *   CONVEX_URL=<your_convex_url> bun scripts/export-convex.ts
 *
 * Outputs JSON files to ./exports/ directory.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { writeFileSync, mkdirSync } from "node:fs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Set admin auth token if available (needed for admin-only queries)
const adminToken = process.env.CONVEX_ADMIN_TOKEN;
if (adminToken) {
  client.setAuth(adminToken);
}

const EXPORT_DIR = "./exports";

// Tables to export — maps Convex table name to the query function
// Most tables can be exported via the admin exportTable function if it exists,
// or via listAll queries. We'll use a generic approach.
const TABLES = [
  "users",
  "userStats",
  "notifications",
  "discordClerkMapping",
  "blogPostContent",
  "blogPosts",
  "blogViews",
  "blogComments",
  "blogReactions",
  "blogInteractions",
  "articleWatchTime",
  "blogCommentReports",
  "blogCommentReactions",
  "contentReports",
  "blogCommentWormhole",
  "newsItems",
  "experienceEvents",
  "timeTrackingSessions",
  "adminSettings",
  "discordEvents",
  "technologies",
  "roles",
  "projects",
  "software",
  "featuredContent",
  "contentHighlights",
  "contentComments",
  "contentReactions",
  "userFeedPosts",
  "pendingFeedPosts",
  "userFeedReactions",
  "vaultFiles",
  "vaultDownloadLogs",
  "supporterNotifications",
  "liveStats",
  "netvuloEvents",
  "widgetInteractions",
  "robloxVerifications",
  "inventoryItems",
  "userInventory",
  "lootboxTemplates",
  "userLootboxes",
  "tierClaimables",
  "tierClaimRecords",
];

async function exportTable(tableName: string): Promise<unknown[]> {
  try {
    // Try using the admin export endpoint if available
    // @ts-expect-error Dynamic API access
    const data = await client.query(api.admin.exportTable, { table: tableName });
    return data as unknown[];
  } catch {
    console.warn(`  Could not export ${tableName} via admin.exportTable, trying alternatives...`);
    // Fall back to table-specific queries
    try {
      switch (tableName) {
        case "users":
          // @ts-expect-error Dynamic API access
          return (await client.query(api.users.listAll, { limit: 10000 })) as unknown[];
        case "blogPosts":
          // @ts-expect-error Dynamic API access
          return (await client.query(api.blogPosts.list, { limit: 10000 })) as unknown[];
        case "projects":
          // @ts-expect-error Dynamic API access
          return (await client.query(api.projects.list, {})) as unknown[];
        case "software":
          // @ts-expect-error Dynamic API access
          return (await client.query(api.software.listAll)) as unknown[];
        default:
          console.warn(`  No export method for ${tableName}, skipping`);
          return [];
      }
    } catch (e2) {
      console.error(`  Failed to export ${tableName}:`, e2);
      return [];
    }
  }
}

async function main() {
  mkdirSync(EXPORT_DIR, { recursive: true });

  console.log(`Exporting ${TABLES.length} tables from Convex...`);
  console.log(`Output directory: ${EXPORT_DIR}\n`);

  let totalDocs = 0;

  for (const table of TABLES) {
    process.stdout.write(`Exporting ${table}...`);
    const data = await exportTable(table);
    const path = `${EXPORT_DIR}/${table}.json`;
    writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(` ${data.length} documents`);
    totalDocs += data.length;
  }

  console.log(`\nDone! Exported ${totalDocs} total documents.`);
}

main().catch(console.error);
