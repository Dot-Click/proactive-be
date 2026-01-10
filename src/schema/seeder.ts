import { database } from "@/configs/connection.config";
import {
  users,
  chats,
  chatParticipants,
  messages,
  faqs,
  categories,
  trips,
} from "./schema";
import { hashPassword } from "@/utils/password.util";
import { env } from "@/utils/env.utils";
import { sql } from "drizzle-orm";

const seed = async () => {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Check if CONNECTION_URL is set
    if (!env.CONNECTION_URL) {
      throw new Error(
        "❌ CONNECTION_URL environment variable is not set!\n" +
        "Please ensure your .env file contains a valid CONNECTION_URL.\n" +
        "Example: CONNECTION_URL=postgresql://user:password@host/database"
      );
    }

    console.log("🔌 Connecting to database...");
    const db = await database();
    
    // Test database connection with a simple query
    try {
      console.log("🧪 Testing database connection...");
      await db.execute(sql`SELECT 1`);
      console.log("✅ Database connection successful!");
    } catch (connectionError: any) {
      const errorMessage = connectionError?.message || connectionError?.toString() || "Unknown error";
      const isNetworkError = errorMessage.includes("fetch failed") || 
                             errorMessage.includes("ECONNREFUSED") ||
                             errorMessage.includes("ENOTFOUND") ||
                             errorMessage.includes("ETIMEDOUT");
      
      if (isNetworkError) {
        throw new Error(
          "❌ Database connection failed!\n\n" +
          "Possible issues:\n" +
          "1. Network connectivity - Check your internet connection\n" +
          "2. Database URL - Verify your CONNECTION_URL is correct\n" +
          "3. Database status - Check if your Supabase database is active\n" +
          "4. Firewall/VPN - Ensure your network allows connections to Supabase\n" +
          "5. Connection string - Ensure you're using the direct connection string (not pooler)\n\n" +
          `Error details: ${errorMessage}\n` +
          `Connection URL format: ${env.CONNECTION_URL.substring(0, 20)}...`
        );
      }
      throw connectionError;
    }

    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Clearing existing data...");
    try {
      await db.delete(messages);
      await db.delete(chatParticipants);
      await db.delete(chats);
      await db.delete(faqs);
      await db.delete(categories);
      await db.delete(users);
    } catch (deleteError: any) {
      const errorMessage = deleteError?.message || deleteError?.toString() || "Unknown error";
      const isNetworkError = errorMessage.includes("fetch failed") || 
                             errorMessage.includes("ECONNREFUSED") ||
                             errorMessage.includes("ENOTFOUND") ||
                             errorMessage.includes("ETIMEDOUT") ||
                             deleteError?.cause?.message?.includes("fetch failed");
      
      if (isNetworkError) {
        throw new Error(
          "❌ Database connection failed during data clearing!\n\n" +
          "Possible issues:\n" +
          "1. Network connectivity - Check your internet connection\n" +
          "2. Database URL - Verify your CONNECTION_URL is correct and accessible\n" +
          "3. Database status - Check if your Supabase database is active\n" +
          "   → Go to https://supabase.com/dashboard and ensure your project is running\n" +
          "4. Firewall/VPN - Ensure your network allows connections to Supabase\n" +
          "5. Connection string format - Ensure it starts with 'postgresql://' or 'postgres://'\n" +
          "6. Use direct connection - Use the direct connection string, not the pooler URL\n\n" +
          `Error details: ${errorMessage}\n` +
          (deleteError?.cause?.message ? `Cause: ${deleteError.cause.message}\n` : "")
        );
      }
      throw deleteError;
    }

    // Seed Users
    console.log("👥 Seeding users...");
    const hashedPassword = await hashPassword("Password123!");
    
    const [, coordinatorUser, regularUser1, regularUser2] =
      await db
        .insert(users)
        .values([
          {
            firstName: "Admin",
            lastName: "User",
            nickName: "Admin User",
            address: "123 Admin Street, City, Country",
            phoneNumber: "+1234567890",
            dob: "1990-01-01",
            gender: "Male",
            password: hashedPassword,
            email: "admin@example.com",
            emailVerified: true,
            userRoles: "admin",
          },
          {
            firstName: "Coordinator",
            lastName: "Smith",
            nickName: "Coordinator Smith",
            address: "456 Coordinator Ave, City, Country",
            phoneNumber: "+1234567891",
            dob: "1985-05-15",
            gender: "Female",
            password: hashedPassword,
            email: "coordinator@example.com",
            emailVerified: true,
            userRoles: "coordinator",
          },
          {
            firstName: "John",
            lastName: "Doe",
            nickName: "John Doe",
            address: "789 User Lane, City, Country",
            phoneNumber: "+1234567892",
            dob: "1992-08-20",
            gender: "Male",
            password: hashedPassword,
            email: "user1@example.com",
            emailVerified: true,
            userRoles: "user",
          },
          {
            firstName: "Jane",
            lastName: "Wilson",
            nickName: "Jane Wilson",
            address: "321 User Road, City, Country",
            phoneNumber: "+1234567893",
            dob: "1995-12-10",
            gender: "Female",
            password: hashedPassword,
            email: "user2@example.com",
            emailVerified: true,
            userRoles: "user",
          },
        ])
        .returning();

    // Seed Categories
    console.log("📁 Seeding categories...");
    await db.insert(categories).values([
      {
        name: "General",
        isActive: true,
      },
      {
        name: "Support",
        isActive: true,
      },
      {
        name: "Technical",
        isActive: true,
      },
    ]);

    // Seed FAQs
    console.log("❓ Seeding FAQs...");
    await db.insert(faqs).values([
      {
        question: "How do I reset my password?",
        answers:
          "You can reset your password by clicking on the 'Forgot Password' link on the login page. You will receive an email with instructions to reset your password.",
      },
      {
        question: "How do I join a chat?",
        answers:
          "You can join a chat by clicking on the chat you want to join from the chat list. If the chat is private, you may need to request access from the coordinator.",
      },
      {
        question: "What is the difference between a user and a coordinator?",
        answers:
          "A coordinator has additional permissions to create and manage chats, while a regular user can participate in chats they are invited to.",
      },
      {
        question: "How do I contact support?",
        answers:
          "You can contact support by sending a message in the Support chat or by emailing support@example.com.",
      },
    ]);

    // Seed Chats
    console.log("💬 Seeding chats...");
    const [chat1, chat2] = await db
      .insert(chats)
      .values([
        {
          name: "General Discussion",
          description: "A general discussion chat for all users",
          coordinatorId: coordinatorUser.id,
          createdBy: coordinatorUser.id,
        },
        {
          name: "Support Chat",
          description: "Get help and support from our team",
          coordinatorId: coordinatorUser.id,
          createdBy: coordinatorUser.id,
        },
      ])
      .returning();

    // Seed Chat Participants
    console.log("👤 Seeding chat participants...");
    await db.insert(chatParticipants).values([
      {
        chatId: chat1.id,
        userId: coordinatorUser.id,
        role: "admin",
      },
      {
        chatId: chat1.id,
        userId: regularUser1.id,
        role: "participant",
      },
      {
        chatId: chat1.id,
        userId: regularUser2.id,
        role: "participant",
      },
      {
        chatId: chat2.id,
        userId: coordinatorUser.id,
        role: "admin",
      },
      {
        chatId: chat2.id,
        userId: regularUser1.id,
        role: "participant",
      },
    ]);

    // Seed Messages
    console.log("📨 Seeding messages...");
    await db.insert(messages).values([
      {
        chatId: chat1.id,
        senderId: coordinatorUser.id,
        content: "Welcome to the General Discussion chat! Feel free to introduce yourself.",
      },
      {
        chatId: chat1.id,
        senderId: regularUser1.id,
        content: "Hello everyone! Nice to be here.",
      },
      {
        chatId: chat1.id,
        senderId: regularUser2.id,
        content: "Hi! Looking forward to chatting with you all.",
      },
      {
        chatId: chat2.id,
        senderId: coordinatorUser.id,
        content: "Welcome to the Support Chat. How can we help you today?",
      },
      {
        chatId: chat2.id,
        senderId: regularUser1.id,
        content: "I need help with my account settings.",
      },
    ]);

    // Seed Trips
    console.log("🚗 Seeding trips...");
    await db.insert(trips).values([
      {
          title: "Trip 1",
          description: "A trip to the mountains",
          coverImage: "https://www.instagram.com/mountains",
          type: "Mountain",
          location: "Mountains",
          startDate: new Date(),
          endDate: new Date(),
          duration: "1 week",
          longDesc: "A trip to the mountains",
          groupSize: "10",
          rhythm: "Mountain",
          sportLvl: "Mountain",
          weekendTt: "Mountain",
          included: null,
          notIncluded: null,
          shortDesc: "A trip to the mountains",
          instaLink: "https://www.instagram.com/mountains",
          likedinLink: "https://www.linkedin.com/mountains",
          promotionalVideo: "https://www.youtube.com/mountains",
          galleryImages: ["https://www.instagram.com/mountains"],
          bestPriceMsg: "Best price message",
          perHeadPrice: "100",
          status: "active",
          approvalStatus: "approved",
      },
      {
        title: "Trip 2",
        description: "A trip to the beach",
        coverImage: "https://www.instagram.com/beach",
        type: "Beach",
        location: "Beach",
        longDesc: "A trip to the beach",
        groupSize: "10",
        rhythm: "Beach",
        sportLvl: "Beach",
        weekendTt: "Beach",
        included: null,
        notIncluded: null,
        shortDesc: "A trip to the beach",
        instaLink: "https://www.instagram.com/beach",
        likedinLink: "https://www.linkedin.com/beach",
        promotionalVideo: "https://www.youtube.com/beach",
        galleryImages: ["https://www.instagram.com/beach"],
        bestPriceMsg: "Best price message",
        perHeadPrice: "100",
        status: "active",
        approvalStatus: "approved",
        duration: "1 week",
        startDate: new Date(),
        endDate: new Date(),
      },
    ]);

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📊 Seeded data summary:");
    console.log(`   - Users: 4 (1 admin, 1 coordinator, 2 regular users)`);
    console.log(`   - Categories: 3`);
    console.log(`   - FAQs: 4`);
    console.log(`   - Chats: 2`);
    console.log(`   - Chat Participants: 5`);
    console.log(`   - Messages: 5`);
    console.log(`   - Trips: 2`);
    console.log("\n🔑 Default password for all users: Password123!");
  } catch (error: any) {
    console.error("\n❌ Error seeding database:");
    
    // Provide helpful error messages
    if (error?.message) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    
    // Additional diagnostics
    if (error?.cause) {
      console.error("\n📋 Additional error details:", error.cause);
    }
    
    console.error("\n💡 Troubleshooting tips:");
    console.error("   1. Verify CONNECTION_URL in your .env file");
    console.error("   2. Check if your Supabase database is active");
    console.error("   3. Ensure your network allows connections to Supabase");
    console.error("   4. Use the direct connection string (not pooler) from Supabase dashboard");
    console.error("   5. Try running: npm run dbpush (to ensure schema is up to date)");
    
    throw error;
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log("✨ Seed script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seed script failed:", error);
      process.exit(1);
    });
}

export default seed;