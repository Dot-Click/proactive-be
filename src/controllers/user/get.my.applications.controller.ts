import { database } from "@/configs/connection.config";
import { applications, trips, locations, categories } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq, desc } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

export const getMyApplications = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const userId = req.user!.userId;
        const db = await database();

        const userApplications = await db
            .select({
                id: applications.id,
                tripId: applications.tripId,
                status: applications.status,
                shortIntro: applications.shortIntro,
                createdAt: applications.createdAt,
                trip: {
                    id: trips.id,
                    title: trips.title,
                    coverImage: trips.coverImage,
                    startDate: trips.startDate,
                    endDate: trips.endDate,
                    perHeadPrice: trips.perHeadPrice,
                    location: locations.name,
                    category: categories.name,
                },
            })
            .from(applications)
            .leftJoin(trips, eq(applications.tripId, trips.id))
            .leftJoin(locations, eq(trips.locationId, locations.id))
            .leftJoin(categories, eq(trips.categoryId, categories.id))
            .where(eq(applications.userId, userId))
            .orderBy(desc(applications.createdAt));

        return sendSuccess(
            res,
            "Applications fetched successfully",
            { applications: userApplications },
            status.OK
        );
    } catch (error) {
        console.error("Get my applications error:", error);
        return sendError(
            res,
            "Failed to fetch applications",
            status.INTERNAL_SERVER_ERROR
        );
    }
};
