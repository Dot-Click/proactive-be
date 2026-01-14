import { database } from "@/configs/connection.config";
import { sendError, sendSuccess } from "@/utils/response.util";
import "@/middlewares/auth.middleware";
import { Request, Response } from "express";
import status from "http-status";
import { sql, eq } from "drizzle-orm";
import { trips, tripCoordinators, applications } from "@/schema/schema";

export const dashboardlogic = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            return sendError(res, "Authentication required", status.UNAUTHORIZED);
        }

        const coordinatorId = req.user.userId;
        const db = await database();
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();



        const keyStatsResult = await db
            .select({
                activeTrips: sql<number>`COUNT(*) FILTER (WHERE ${trips.status} = 'active')::int`,
                activeCurrentMonth: sql<number>`COUNT(*) FILTER (WHERE ${trips.status}='active' AND ${trips.createdAt} >= ${currentMonthStart})::int`,
                activePreviousMonth: sql<number>`COUNT(*) FILTER (WHERE ${trips.status}='active' AND ${trips.createdAt} >= ${previousMonthStart} AND ${trips.createdAt} < ${currentMonthStart})::int`,
                upcomingTrips: sql<number>`COUNT(*) FILTER (WHERE ${trips.startDate} > ${now.toISOString()} AND ${trips.status} IN ('active','pending'))::int`,
                closedTrips: sql<number>`COUNT(*) FILTER (WHERE ${trips.status} = 'completed')::int`,
                pendingReviews: sql<number>`COUNT(${applications.id}) FILTER (WHERE ${applications.status}='pending')::int`
            })
            .from(trips)
            .leftJoin(tripCoordinators, eq(tripCoordinators.tripId, trips.id))
            .leftJoin(applications, eq(applications.tripId, trips.id))
            .where(eq(tripCoordinators.userId, coordinatorId));

        const keyStats = keyStatsResult[0] || {
            activeTrips: 0,
            activeCurrentMonth: 0,
            activePreviousMonth: 0,
            upcomingTrips: 0,
            closedTrips: 0,
            pendingReviews: 0
        };

        const calcPercentageChange = (current: number, previous: number) =>
            previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

        const categoriesResult = await db
            .select({
                type: trips.type,
                count: sql<number>`COUNT(*)::int`
            })
            .from(trips)
            .innerJoin(tripCoordinators, eq(tripCoordinators.tripId, trips.id))
            .where(eq(tripCoordinators.userId, coordinatorId))
            .groupBy(trips.type)
            .orderBy(sql`count DESC`);

        const totalForCategories = categoriesResult.reduce((sum, c) => sum + c.count, 0);
        const tripCategories = categoriesResult.map(c => ({
            name: c.type || 'Other',
            count: c.count,
            percentage: totalForCategories ? Math.round((c.count / totalForCategories) * 100) : 0
        }));


        const recentTrips = await db
            .select({
                id: trips.id,
                tripName: trips.title,
                category: trips.type,
                startDate: trips.startDate,
                endDate: trips.endDate,
                coverImage: trips.coverImage,
                location: trips.location,
                status: trips.status,
                approvalStatus: trips.approvalStatus
            })
            .from(trips)
            .innerJoin(tripCoordinators, eq(tripCoordinators.tripId, trips.id))
            .where(eq(tripCoordinators.userId, coordinatorId))
            .orderBy(sql`${trips.createdAt} DESC`)
            .limit(10);


        const recentActivity = await db
            .select({
                actionType: trips.approvalStatus,
                tripName: trips.title,
                activityDate: trips.updatedAt
            })
            .from(trips)
            .innerJoin(tripCoordinators, eq(tripCoordinators.tripId, trips.id))
            .where(sql`${tripCoordinators.userId} = ${coordinatorId} AND ${trips.updatedAt} >= ${sevenDaysAgo}`)
            .orderBy(sql`${trips.updatedAt} DESC`)
            .limit(10);

        const dashboard = {
            keyStats: {
                activeTrips: {
                    value: keyStats.activeTrips,
                    percentageChange: parseFloat(
                        calcPercentageChange(keyStats.activeCurrentMonth, keyStats.activePreviousMonth).toFixed(1)
                    ),
                    isPositive: keyStats.activeCurrentMonth >= keyStats.activePreviousMonth
                },
                upcomingTrips: { value: keyStats.upcomingTrips },
                pendingReviews: { value: keyStats.pendingReviews },
                closedTrips: { value: keyStats.closedTrips }
            },
            tripCategories,
            allTrips: recentTrips,
            recentActivity
        };

        return sendSuccess(res, "Dashboard data retrieved successfully", dashboard, status.OK);

    } catch (error: any) {
        console.error("Coordinator dashboard error:", error);
        return sendError(res, error.message || "An error occurred while fetching dashboard data", status.INTERNAL_SERVER_ERROR);
    }
};

