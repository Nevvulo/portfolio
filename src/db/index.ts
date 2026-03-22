import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Guard: Pages Router bundles this into client where DATABASE_URL is absent.
// The db object is never used on the client (server actions handle all queries).
const sql =
  typeof window === "undefined" ? postgres(process.env.DATABASE_URL!, { max: 10 }) : (undefined as any);
export const db =
  typeof window === "undefined" ? drizzle(sql, { schema }) : (undefined as any);
