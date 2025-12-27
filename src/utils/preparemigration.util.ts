import { migrateSchema } from "@/configs/connection.config";
import { logger } from "./logger.util";

/**
 * @param enableMigration
 * Make sure to pass true before pushing it to production.
 */

export const prepareMigration = async (enableMigration = false) => {
  if (!enableMigration) return null;
  try {
    await migrateSchema();
    logger.info("migration successful.");
  } catch (e) {
    const error = e as Error;
    // Log full error details for debugging
    logger.error(`migration failure: ${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    // Only warn if it's not a "already exists" error
    if (!error.message.includes("already exists") && 
        !error.message.includes("42P07") && 
        !error.message.includes("23505")) {
      logger.warn('make sure to run the command "npm run dbgenerate".');
    }
  }
};
