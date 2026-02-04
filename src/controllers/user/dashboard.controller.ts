import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { sendError, sendSuccess } from "@/utils/response.util";
import status from "http-status";
import { sql, eq, and, desc, isNull } from "drizzle-orm";
import {
  users,
  applications,
  trips,
  achievements,
  reviews,
  payments,
  locations,
} from "@/schema/schema";
import "@/middlewares/auth.middleware";

export const dashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const userId = req.user.userId;
    const db = await database();

    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        avatar: users.avatar,
        nickName: users.nickName,
        dob: users.dob,
        gender: users.gender,
        address: users.address,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    const [membership] = await db
      .select({
        membershipType: payments.membershipType,
      })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.status, "paid")))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    const [stats] = await db
      .select({
        tripsAttended: sql<number>`
            COUNT(${applications.id}) FILTER (WHERE ${applications.status} = 'approved')
          `,
        achievementsCount: sql<number>`
            COUNT(${achievements.id}) FILTER (WHERE ${achievements.unlocked} = true)
          `,
        adventurePoints: sql<number>`
            COALESCE(SUM(${achievements.points}), 0)
          `,
      })
      .from(users)
      .leftJoin(applications, eq(applications.userId, users.id))
      .leftJoin(achievements, eq(achievements.userId, users.id))
      .where(eq(users.id, userId));

    const upcomingAdventures = await db
      .select({
        id: trips.id,
        title: trips.title,
        location: locations.name,
        startDate: trips.startDate,
        endDate: trips.endDate,
        coverImage: trips.coverImage,
        type: trips.type,
        duration: trips.duration,
        status: trips.status,
      })
      .from(trips)
      .innerJoin(applications, eq(applications.tripId, trips.id))
      .leftJoin(locations, eq(trips.locationId, locations.id))
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, "approved"),
          sql`${trips.startDate} > now()`
        )
      )
      .orderBy(trips.startDate)
      .limit(5);

    const userAchievements = await db
      .select({
        id: achievements.id,
        badge: achievements.badges,
        points: achievements.points,
        level: achievements.level,
      })
      .from(achievements)
      .where(
        and(eq(achievements.userId, userId), eq(achievements.unlocked, true))
      )
      .limit(10);

    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      return sendError(
        res,
        "RAPID_API_KEY is not configured",
        status.INTERNAL_SERVER_ERROR
      );
    }

    const limit = 5;
    const business_id = "0x65e285d9dffa46ab:0x3dd1b18e867e6183";
    const data = await fetch(
      `https://local-business-data.p.rapidapi.com/business-reviews?business_id=${business_id}&limit=${limit}&translate_reviews=false&sort_by=most_relevant&region=us&language=es`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "local-business-data.p.rapidapi.com",
        },
      }
    );

    const json = await data.json();

    if (!json.data || !Array.isArray(json.data)) {
      return sendSuccess(
        res,
        "Reviews fetched successfully",
        { reviews: [] },
        status.OK
      );
    }

    const reviewReminders = json.data.map((review: any) => ({
      link: review.review_link,
      userImage: review.author_photo_url,
      userName: review.author_name,
      review: review.review_text,
    }));

    const fields = [
      user.firstName,
      user.lastName,
      user.email,
      user.avatar,
      user.dob,
      user.gender,
      user.address,
      user.phoneNumber,
    ];

    const profileCompleteness = Math.round(
      (fields.filter(Boolean).length / fields.length) * 100
    );

    return sendSuccess(
      res,
      "Dashboard loaded",
      {
        keyStats: {
          tripsAttended: stats.tripsAttended ?? 0,
          achievements: stats.achievementsCount ?? 0,
          adventurePoints: stats.adventurePoints ?? 0,
        },
        upcomingAdventures,
        achievements: userAchievements,
        reviewReminders,
        userProfile: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.nickName ||
            "User",
          email: user.email,
          avatar: user.avatar,
          membershipType: membership?.membershipType ?? null,
          isGoldMember:
            membership?.membershipType?.toLowerCase().includes("gold") ?? false,
        },
        profileCompleteness,
      },
      status.OK
    );
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return sendError(
      res,
      "Failed to load dashboard",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
