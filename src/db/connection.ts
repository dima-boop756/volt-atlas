import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function createConnection(max: number) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");
  const client = postgres(url, { max, prepare: false, idle_timeout: 20, connect_timeout: 12 });
  return { client, db: drizzle(client) };
}
