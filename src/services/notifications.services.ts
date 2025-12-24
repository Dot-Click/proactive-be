import { database } from "@/configs/connection.config";
import { notifications } from "@/schema/schema";
import { eq } from "drizzle-orm";


export const createNotification = async (notification: any): Promise<any> => {
  try {
        const db = await database();
        const notf = await db.insert(notifications).values({
            userId: notification.userId,
            title: notification.title,
            description: notification.description,
            type: notification.type,
        }).returning()
        return notf[0];
    } catch (error) {
        console.error("Create notification error:", error);
        throw error;
    }
};

export const updateNotification = async (notification: any): Promise<any> => {
  try {
    const db = await database();
    const notf = await db.update(notifications).set({
      read: notification.read,
    }).where(eq(notifications.id, notification.id)).returning()
    return notf[0];
  } catch (error) {
    console.error("Update notification error:", error);
    throw error;
  }
};