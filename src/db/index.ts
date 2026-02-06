import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Guard: Pages Router bundles this into client where DATABASE_URL is absent.
// The db object is never used on the client (server actions handle all queries).
const sql =
  typeof window === "undefined" ? neon(process.env.DATABASE_URL!) : (undefined as any);
export const db =
  typeof window === "undefined" ? drizzle(sql, { schema }) : (undefined as any);
