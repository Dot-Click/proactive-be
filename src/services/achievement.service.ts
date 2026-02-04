import { database } from "@/configs/connection.config";
import {
  achievements,
  trips,
  applications,
  tripCoordinators,
  globalSettings,
} from "@/schema/schema";
import { eq, and, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

/**
 * Achievement criteria configuration
 */
export const ACHIEVEMENT_CRITERIA = {
  "Mountain Climber": {
    requiredTrips: 5,
    pointsPerTrip: 20,
  },
  "Culture Explorer": {
    requiredTrips: 3,
    pointsPerTrip: 15,
  },
  "Nature Lover": {
    requiredTrips: 3,
    pointsPerTrip: 15,
  },
  Leader: {
    requiredRoles: 1,
    pointsPerRole: 50,
  },
} as const;

/**
 * Map trip category names to achievement badges
 * This mapping determines which badge a trip category contributes to
 */
const CATEGORY_TO_BADGE_MAPPING: Record<string, string[]> = {
  Adventure: ["Mountain Climber"],
  Hiking: ["Mountain Climber"],
  Trekking: ["Mountain Climber"],
  Mountaineering: ["Mountain Climber"],
  "Wild Weekend": ["Mountain Climber"],

  Cultural: ["Culture Explorer"],
  Heritage: ["Culture Explorer"],
  Historical: ["Culture Explorer"],
  "City Tour": ["Culture Explorer"],

  Nature: ["Nature Lover"],
  "Eco-Friendly": ["Nature Lover"],
  Conservation: ["Nature Lover"],
  Wildlife: ["Nature Lover"],
  Sustainability: ["Nature Lover"],
};

/**
 * Get trip categories from global settings
 */
const getTripCategoriesFromSettings = async (): Promise<
  Array<{ id: string; name: string; description?: string; enabled?: boolean }>
> => {
  const db = await database();

  try {
    const settings = await db
      .select({ tripCategories: globalSettings.tripCategories })
      .from(globalSettings)
      .limit(1);

    if (settings.length === 0 || !settings[0].tripCategories) {
      console.warn(
        "No trip categories found in settings, using default mapping"
      );
      return [];
    }

    const categories = settings[0].tripCategories as any;
    if (!Array.isArray(categories)) {
      console.warn("Trip categories is not an array, using default mapping");
      return [];
    }

    return categories.filter((cat: any) => cat.enabled !== false);
  } catch (error) {
    console.error("Error fetching trip categories from settings:", error);
    return [];
  }
};

/**
 * Check which achievement badges a trip contributes to based on trip category
 */
export const getAchievementBadgeForTrip = async (
  tripType: string
): Promise<string[]> => {
  const matchingBadges: string[] = [];

  const tripCategories = await getTripCategoriesFromSettings();

  const normalizedTripType = tripType.toLowerCase().trim();

  for (const category of tripCategories) {
    const categoryName = category.name.toLowerCase().trim();

    if (
      normalizedTripType === categoryName ||
      normalizedTripType.includes(categoryName) ||
      categoryName.includes(normalizedTripType)
    ) {
      const badges = CATEGORY_TO_BADGE_MAPPING[category.name] || [];
      badges.forEach((badge) => {
        if (!matchingBadges.includes(badge)) {
          matchingBadges.push(badge);
        }
      });
    }
  }

  if (matchingBadges.length === 0) {
    const tripTypeLower = normalizedTripType;

    if (
      tripTypeLower.includes("hiking") ||
      tripTypeLower.includes("trekking") ||
      tripTypeLower.includes("mountain") ||
      tripTypeLower.includes("mountaineering") ||
      tripTypeLower.includes("climbing") ||
      tripTypeLower.includes("wild weekend")
    ) {
      matchingBadges.push("Mountain Climber");
    }

    if (
      tripTypeLower.includes("cultural") ||
      tripTypeLower.includes("city tour") ||
      tripTypeLower.includes("heritage") ||
      tripTypeLower.includes("historical") ||
      tripTypeLower.includes("museum")
    ) {
      matchingBadges.push("Culture Explorer");
    }

    if (
      tripTypeLower.includes("eco-friendly") ||
      tripTypeLower.includes("nature") ||
      tripTypeLower.includes("conservation") ||
      tripTypeLower.includes("wildlife") ||
      tripTypeLower.includes("sustainability") ||
      tripTypeLower.includes("environmental")
    ) {
      matchingBadges.push("Nature Lover");
    }
  }

  return matchingBadges;
};

/**
 * Track achievement progress when a user joins/completes a trip
 */
export const trackTripAchievement = async (
  userId: string,
  tripId: string,
  role: "participant" | "leader" = "participant"
): Promise<void> => {
  const db = await database();

  try {
    const tripResults = await db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);

    if (tripResults.length === 0) {
      console.warn(`Trip ${tripId} not found for achievement tracking`);
      return;
    }

    const trip = tripResults[0];

    const applicableBadges = await getAchievementBadgeForTrip(trip.type);

    for (const badge of applicableBadges) {
      const criteria =
        ACHIEVEMENT_CRITERIA[badge as keyof typeof ACHIEVEMENT_CRITERIA];

      const existingAchievement = await db
        .select()
        .from(achievements)
        .where(
          and(
            eq(achievements.userId, userId),
            eq(achievements.tripId, tripId),
            eq(achievements.badges, badge as any)
          )
        )
        .limit(1);

      if (existingAchievement.length === 0) {
        const points =
          badge === "Leader"
            ? ACHIEVEMENT_CRITERIA["Leader"].pointsPerRole || 0
            : "pointsPerTrip" in criteria
            ? criteria.pointsPerTrip
            : 0;

        await db.insert(achievements).values({
          id: createId(),
          userId,
          tripId,
          badges: badge as any,
          points,
          progress: 1,
          level: "Bronze",
          unlocked: false,
          role: role,
        });

        await checkAndUnlockBadge(userId, badge);
      }
    }

    if (role === "leader") {
      const leaderCriteria = ACHIEVEMENT_CRITERIA["Leader"];

      const existingLeaderAchievement = await db
        .select()
        .from(achievements)
        .where(
          and(
            eq(achievements.userId, userId),
            eq(achievements.tripId, tripId),
            eq(achievements.badges, "Leader" as any),
            eq(achievements.role, "leader")
          )
        )
        .limit(1);

      if (existingLeaderAchievement.length === 0) {
        await db.insert(achievements).values({
          id: createId(),
          userId,
          tripId,
          badges: "Leader" as any,
          points: leaderCriteria.pointsPerRole,
          progress: 1,
          level: "Bronze",
          unlocked: false,
          role: "leader",
        });

        await checkAndUnlockBadge(userId, "Leader");
      }
    }
  } catch (error) {
    console.error("Error tracking trip achievement:", error);
    throw error;
  }
};

/**
 * Check if a badge should be unlocked based on user's progress
 */
export const checkAndUnlockBadge = async (
  userId: string,
  badge: string
): Promise<boolean> => {
  const db = await database();

  try {
    const criteria =
      ACHIEVEMENT_CRITERIA[badge as keyof typeof ACHIEVEMENT_CRITERIA];

    if (!criteria) {
      console.warn(`No criteria found for badge: ${badge}`);
      return false;
    }

    const progressResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(achievements)
      .where(
        and(
          eq(achievements.userId, userId),
          eq(achievements.badges, badge as any)
        )
      );

    const tripCount = Number(progressResult[0]?.count) || 0;

    let shouldUnlock = false;
    if (badge === "Leader") {
      const leaderCriteria = ACHIEVEMENT_CRITERIA["Leader"];
      shouldUnlock = tripCount >= leaderCriteria.requiredRoles;
    } else {
      const tripBadge = badge as
        | "Mountain Climber"
        | "Culture Explorer"
        | "Nature Lover";
      const tripCriteria = ACHIEVEMENT_CRITERIA[tripBadge];
      shouldUnlock = tripCount >= tripCriteria.requiredTrips;
    }

    if (shouldUnlock) {
      await db
        .update(achievements)
        .set({ unlocked: true })
        .where(
          and(
            eq(achievements.userId, userId),
            eq(achievements.badges, badge as any)
          )
        );

      console.log(`Badge "${badge}" unlocked for user ${userId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error checking badge unlock for ${badge}:`, error);
    return false;
  }
};

/**
 * Get user's achievement progress summary
 */
export const getUserAchievements = async (userId: string) => {
  const db = await database();

  try {
    const userAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId));

    const badgeProgress: Record<
      string,
      {
        totalTrips: number;
        unlocked: boolean;
        progress: number;
        required: number;
        percentage: number;
        points: number;
      }
    > = {};

    for (const badge of Object.keys(ACHIEVEMENT_CRITERIA)) {
      const badgeAchievements = userAchievements.filter(
        (a) => a.badges === badge
      );

      const criteria =
        ACHIEVEMENT_CRITERIA[badge as keyof typeof ACHIEVEMENT_CRITERIA];
      const totalTrips = badgeAchievements.length;
      const unlocked = badgeAchievements.some((a) => a.unlocked);
      const totalPoints = badgeAchievements.reduce(
        (sum, a) => sum + (a.points || 0),
        0
      );

      let required = 0;
      if (badge === "Leader") {
        const leaderCriteria = ACHIEVEMENT_CRITERIA["Leader"];
        required = leaderCriteria.requiredRoles;
      } else {
        const tripBadge = badge as
          | "Mountain Climber"
          | "Culture Explorer"
          | "Nature Lover";
        const tripCriteria = ACHIEVEMENT_CRITERIA[tripBadge];
        required = tripCriteria.requiredTrips;
      }

      badgeProgress[badge] = {
        totalTrips,
        unlocked,
        progress: totalTrips,
        required,
        percentage:
          required > 0 ? Math.min((totalTrips / required) * 100, 100) : 0,
        points: totalPoints,
      };
    }

    return {
      achievements: userAchievements,
      badgeProgress,
      totalPoints: userAchievements.reduce(
        (sum, a) => sum + (a.points || 0),
        0
      ),
      unlockedBadges: userAchievements
        .filter((a) => a.unlocked)
        .map((a) => a.badges)
        .filter((value, index, self) => self.indexOf(value) === index),
    };
  } catch (error) {
    console.error("Error getting user achievements:", error);
    throw error;
  }
};
