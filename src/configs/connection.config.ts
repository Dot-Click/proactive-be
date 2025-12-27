import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import * as schema from "@/schema/schema";
import { env } from "@/utils/env.utils";

// Regular database connection using HTTP driver (faster, no transactions)
export const database = async (logger = false) => {
  try {
    let trial = 0;
    while (trial < 3) {
      try {
        return drizzleHttp({
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

// Migration database connection using postgres-js (supports transactions)
export const migrationDatabase = async () => {
  try {
    // Use postgres client for migrations which supports transactions
    const sql = postgres(env.CONNECTION_URL, {
      max: 1, // Use single connection for migrations
      onnotice: () => {}, // Suppress NOTICE logs (e.g., "already exists" messages)
      connection: {
        application_name: "drizzle-migrator",
      },
    });
    
    const db = drizzlePostgres({
      client: sql,
      schema,
    });
    
    // Return both db and sql client so we can close it later
    return { db, sql };
  } catch (error) {
    console.error("Error creating migration database connection:", error);
    throw error;
  }
}

export const migrateSchema = async () => {
  const { db, sql } = await migrationDatabase();
  try {
    await migrate(db, { 
      migrationsFolder: "drizzle",
      migrationsTable: "__drizzle_migrations"
    });
  } catch (error: any) {
    // Check if error is about existing tables/relations (already migrated)
    const isAlreadyExistsError = 
      error?.cause?.code === "42P07" || // relation already exists
      error?.code === "42P07" ||
      error?.code === "23505" || // duplicate key
      error?.message?.includes("already exists") ||
      (error?.message?.includes("relation") && error?.message?.includes("already exists"));
    
    if (isAlreadyExistsError) {
      // Tables already exist - migration likely already applied
      // This is normal when database is already set up, silently continue
      return;
    }
    
    // For other errors, log and re-throw
    console.error("Migration error:", error?.message || "Unknown migration error");
    throw error;
  } finally {
    // Close the postgres connection after migration
    await sql.end();
  }
}
