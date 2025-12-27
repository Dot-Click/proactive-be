import { database } from "@/configs/connection.config";
import { users, trips, payments } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";


const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

export const dashboardlogic = async (_req: Request, res: Response) => {
    try {
        const db = await database();
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

        const totalUsersResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users).where(eq(users.userRoles, "user"));
        const totalUsers = Number(totalUsersResult[0]?.count) || 0;


        const previousMonthUsersResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(lte(users.createdAt, previousMonthEnd));
        const previousMonthUsers = Number(previousMonthUsersResult[0]?.count) || 0;
        const usersPercentageChange = calculatePercentageChange(totalUsers, previousMonthUsers);


        const coordinatorsResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(eq(users.userRoles, "coordinator"));
        const coordinators = Number(coordinatorsResult[0]?.count) || 0;


        const previousMonthCoordinatorsResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(
                and(
                    eq(users.userRoles, "coordinator"),
                    lte(users.createdAt, previousMonthEnd)
                )
            );
        const previousMonthCoordinators = Number(previousMonthCoordinatorsResult[0]?.count) || 0;
        const coordinatorsPercentageChange = calculatePercentageChange(coordinators, previousMonthCoordinators);

        // Get active trips count
        const activeTripsResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(trips)
            .where(eq(trips.status, "active"));
        const activeTrips = Number(activeTripsResult[0]?.count) || 0;

        // Get active trips from previous month
        const previousMonthActiveTripsResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(trips)
            .where(
                and(
                    eq(trips.status, "active"),
                    lte(trips.createdAt, previousMonthEnd)
                )
            );
        const previousMonthActiveTrips = Number(previousMonthActiveTripsResult[0]?.count) || 0;
        const activeTripsPercentageChange = calculatePercentageChange(activeTrips, previousMonthActiveTrips);


        const closedTripsResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(trips)
            .where(eq(trips.status, "completed"));
        const closedTrips = Number(closedTripsResult[0]?.count) || 0;


        const previousMonthClosedTripsResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(trips)
            .where(
                and(
                    eq(trips.status, "completed"),
                    lte(trips.createdAt, previousMonthEnd)
                )
            );
        const previousMonthClosedTrips = Number(previousMonthClosedTripsResult[0]?.count) || 0;
        const closedTripsPercentageChange = calculatePercentageChange(closedTrips, previousMonthClosedTrips);


        const monthlyEarnings: { month: string; earnings: number }[] = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 0; i < 12; i++) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            
            const monthEarningsResult = await db
                .select({ 
                    total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)::float`
                })
                .from(payments)
                .where(
                    and(
                        eq(payments.status, "paid"),
                        gte(payments.createdAt, monthStart),
                        lte(payments.createdAt, monthEnd)
                    )
                );
            
            const earnings = Number(monthEarningsResult[0]?.total) || 0;
            const monthIndex = (now.getMonth() - i + 12) % 12;
            monthlyEarnings.unshift({
                month: months[monthIndex],
                earnings: parseFloat(earnings.toFixed(2))
            });
        }

        // Get total earnings for current month
        const currentMonthEarningsResult = await db
            .select({ 
                total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)::float`
            })
            .from(payments)
            .where(
                and(
                    eq(payments.status, "paid"),
                    gte(payments.createdAt, currentMonthStart)
                )
            );
        const currentMonthEarnings = Number(currentMonthEarningsResult[0]?.total) || 0;

        // Get total earnings for previous month
        const previousMonthEarningsResult = await db
            .select({ 
                total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)::float`
            })
            .from(payments)
            .where(
                and(
                    eq(payments.status, "paid"),
                    gte(payments.createdAt, previousMonthStart),
                    lte(payments.createdAt, previousMonthEnd)
                )
            );
        const previousMonthEarnings = Number(previousMonthEarningsResult[0]?.total) || 0;
        const earningsPercentageChange = calculatePercentageChange(currentMonthEarnings, previousMonthEarnings);

        // Get trip categories breakdown
        const tripCategoriesResult = await db
            .select({
                type: trips.type,
                count: sql<number>`count(*)::int`
            })
            .from(trips)
            .groupBy(trips.type);
        
        const totalTripsForCategories = tripCategoriesResult.reduce((sum, item) => sum + Number(item.count), 0);
        const tripCategories = tripCategoriesResult.map(item => ({
            name: item.type || "Other",
            percentage: totalTripsForCategories > 0 
                ? Math.round((Number(item.count) / totalTripsForCategories) * 100)
                : 0
        }));

        // Get recent activity (recent payments with membership upgrades)
        const recentActivitiesResult = await db
            .select({
                id: payments.id,
                userId: payments.userId,
                membershipType: payments.membershipType,
                createdAt: payments.createdAt,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            })
            .from(payments)
            .innerJoin(users, eq(payments.userId, users.id))
            .where(
                and(
                    eq(payments.status, "paid"),
                    sql`${payments.membershipType} IS NOT NULL`,
                    gte(payments.createdAt, oneMonthAgo)
                )
            )
            .orderBy(desc(payments.createdAt))
            .limit(10);

        const recentActivity = recentActivitiesResult.map(activity => {
            let userName = "User";
            if (activity.firstName && activity.lastName) {
                userName = `${activity.firstName}${activity.lastName}`;
            } else if (activity.email) {
                userName = activity.email.split('@')[0];
            }
            const timeAgo = getTimeAgo(activity.createdAt);
            
            return {
                id: activity.id,
                message: `User ${userName} upgraded to ${activity.membershipType || "Gold"} Membership`,
                timeAgo: timeAgo,
                createdAt: activity.createdAt
            };
        });

        // Format response
        const dashboardData = {
            keyStats: {
                totalUsers: {
                    value: totalUsers,
                    percentageChange: parseFloat(usersPercentageChange.toFixed(1)),
                    isPositive: usersPercentageChange >= 0
                },
                coordinators: {
                    value: coordinators,
                    percentageChange: parseFloat(coordinatorsPercentageChange.toFixed(1)),
                    isPositive: coordinatorsPercentageChange >= 0
                },
                activeTrips: {
                    value: activeTrips,
                    percentageChange: parseFloat(activeTripsPercentageChange.toFixed(1)),
                    isPositive: activeTripsPercentageChange >= 0
                },
                closedTrips: {
                    value: closedTrips,
                    percentageChange: parseFloat(closedTripsPercentageChange.toFixed(1)),
                    isPositive: closedTripsPercentageChange >= 0
                }
            },
            earningsOverview: {
                monthlyData: monthlyEarnings,
                totalEarnings: parseFloat(currentMonthEarnings.toFixed(2)),
                percentageChange: parseFloat(earningsPercentageChange.toFixed(1)),
                isPositive: earningsPercentageChange >= 0
            },
            tripCategories: tripCategories,
            recentActivity: recentActivity
        };

        return sendSuccess(res, "Dashboard data retrieved successfully", dashboardData, status.OK);
    } catch (error: any) {
        console.error("Dashboard error:", error);
        return sendError(res, error.message || "An error occurred while fetching dashboard data", status.INTERNAL_SERVER_ERROR);
    }
};


const getTimeAgo = (date: Date | null): string => {
    if (!date) return "Unknown";
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return minutes <= 1 ? "1 minute ago" : `${minutes} minutes ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return days === 1 ? "1 day ago" : `${days} days ago`;
    }
};

