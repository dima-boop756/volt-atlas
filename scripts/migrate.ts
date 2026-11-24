import "./env";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createConnection } from "../src/db/connection";

async function main() {
  const { client, db } = createConnection(1);
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Миграции применены.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Не удалось применить миграции.", error);
  process.exitCode = 1;
});
