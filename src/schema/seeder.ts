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

const seed = async () => {
  try {
    console.log("🌱 Starting database seeding...");
    const db = await database();

    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Clearing existing data...");
    await db.delete(messages);
    await db.delete(chatParticipants);
    await db.delete(chats);
    await db.delete(faqs);
    await db.delete(categories);
    await db.delete(users);

    // Seed Users
    console.log("👥 Seeding users...");
    const hashedPassword = await hashPassword("Password123!");
    
    const [, coordinatorUser, regularUser1, regularUser2] =
      await db
        .insert(users)
        .values([
          {
            FirstName: "Admin",
            LastName: "User",
            NickName: "Admin User",
            Address: "123 Admin Street, City, Country",
            PhoneNumber: "+1234567890",
            DOB: "1990-01-01",
            Gender: "Male",
            Password: hashedPassword,
            email: "admin@example.com",
            emailVerified: true,
            userRoles: "admin",
          },
          {
            FirstName: "Coordinator",
            LastName: "Smith",
            NickName: "Coordinator Smith",
            Address: "456 Coordinator Ave, City, Country",
            PhoneNumber: "+1234567891",
            DOB: "1985-05-15",
            Gender: "Female",
            Password: hashedPassword,
            email: "coordinator@example.com",
            emailVerified: true,
            userRoles: "coordinator",
          },
          {
            FirstName: "John",
            LastName: "Doe",
            NickName: "John Doe",
            Address: "789 User Lane, City, Country",
            PhoneNumber: "+1234567892",
            DOB: "1992-08-20",
            Gender: "Male",
            Password: hashedPassword,
            email: "user1@example.com",
            emailVerified: true,
            userRoles: "user",
          },
          {
            FirstName: "Jane",
            LastName: "Wilson",
            NickName: "Jane Wilson",
            Address: "321 User Road, City, Country",
            PhoneNumber: "+1234567893",
            DOB: "1995-12-10",
            Gender: "Female",
            Password: hashedPassword,
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
  } catch (error) {
    console.error("❌ Error seeding database:", error);
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