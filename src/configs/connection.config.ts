import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/schema/schema";
import { env } from "@/utils/env.utils";

export const database = async (logger = false) => {
  try {
    let trial = 0;
    while (trial < 3) {
      try {
        return drizzle({
          client: neon(env.CONNECTION_URL),
          // Removed casing option to use exact column names from schema
          // If your database uses snake_case, add: casing: "snake_case"
          logger,
          schema,
        });
      } catch (error) {
        console.error("Error connecting to database:", error);
        trial++;
      }
    }
    throw new Error("Failed to connect to database after 3 trials");
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}

export const migrateSchema = async (
  db: PostgresJsDatabase<Record<string, unknown>>
) => await migrate(db, { migrationsFolder: "drizzle" });
