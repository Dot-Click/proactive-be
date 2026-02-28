import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/schema/schema";
import { env } from "@/utils/env.utils";

let postgresClient: postgres.Sql | null = null;

export const database = async (logger = false) => {
  try {
    // Create singleton postgres client if it doesn't exist
    if (!postgresClient) {
      postgresClient = postgres(env.CONNECTION_URL, {
        max: 10, // Connection pool size
        prepare: false, // Required for PgBouncer/Railway transaction poolers
        fetch_types: false, // Prevents 08P01 invalid message format errors
        idle_timeout: 20, // Close idle connections before the pooler does
        max_lifetime: 60 * 30, // Drop connections older than 30 minutes
        onnotice: () => { }, // Suppress NOTICE logs
        connection: {
          application_name: "proactive-be",
        },
      });
    }

    return drizzlePostgres({
      client: postgresClient,
      schema,
      logger,
    });
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}

// Migration database connection using postgres-js (supports transactions)
export const migrationDatabase = async () => {
  try {
    const sql = postgres(env.CONNECTION_URL, {
      max: 1,
      prepare: false,
      fetch_types: false,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
      onnotice: () => { },
      connection: {
        application_name: "drizzle-migrator",
      },
    });

    const db = drizzlePostgres({
      client: sql,
      schema,
    });

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
      error?.cause?.code === "42P07" ||
      error?.code === "42P07" ||
      error?.code === "23505" ||
      error?.message?.includes("already exists") ||
      (error?.message?.includes("relation") && error?.message?.includes("already exists"));

    if (isAlreadyExistsError) {
      // Tables already exist - migration likely already applied
      // This is normal when database is already set up, silently continue
      return;
    }

    console.error("Migration error:", error?.message || "Unknown migration error");
    throw error;
  } finally {
    await sql.end();
  }
}
