import { database } from "@/configs/connection.config";
import {
  users,
  chats,
  chatParticipants,
  messages,
  faqs,
  categories,
  trips,
  globalSettings,
  coordinatorDetails,
  tripCoordinators,
  payments,
  discounts,
  applications,
  reviews,
  achievements,
  notifications,
  newsletterSubscribers,
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
          "Example: CONNECTION_URL=postgresql://user:password@host/database",
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
      const errorMessage =
        connectionError?.message ||
        connectionError?.toString() ||
        "Unknown error";
      const isNetworkError =
        errorMessage.includes("fetch failed") ||
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
            `Connection URL format: ${env.CONNECTION_URL.substring(0, 20)}...`,
        );
      }
      throw connectionError;
    }

    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Clearing existing data...");
    try {
      try {
        await db.delete(notifications);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(achievements);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(reviews);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(applications);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(discounts);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(payments);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(tripCoordinators);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(messages);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(chatParticipants);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(chats);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(faqs);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(categories);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(globalSettings);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(trips);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(coordinatorDetails);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(newsletterSubscribers);
      } catch (e) {
        /* table may not exist */
      }
      try {
        await db.delete(users);
      } catch (e) {
        /* table may not exist */
      }
    } catch (deleteError: any) {
      const errorMessage =
        deleteError?.message || deleteError?.toString() || "Unknown error";
      const isNetworkError =
        errorMessage.includes("fetch failed") ||
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
            (deleteError?.cause?.message
              ? `Cause: ${deleteError.cause.message}\n`
              : ""),
        );
      }
      throw deleteError;
    }

    // Seed Users
    console.log("👥 Seeding users...");
    const hashedPassword = await hashPassword("Password123!");

    const [
      adminUser,
      coordinatorUser,
      regularUser1,
      regularUser2,
      regularUser3,
    ] = await db
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
          userStatus: "active",
          userRoles: "admin",
          provider: "email",
          lastActive: new Date().toISOString(),
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
          userStatus: "active",
          userRoles: "coordinator",
          provider: "email",
          lastActive: new Date().toISOString(),
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
          userStatus: "active",
          userRoles: "user",
          provider: "email",
          lastActive: new Date().toISOString(),
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
          userStatus: "active",
          userRoles: "user",
          provider: "email",
          lastActive: new Date().toISOString(),
        },
        {
          firstName: "Robert",
          lastName: "Johnson",
          nickName: "Rob Johnson",
          address: "555 Adventure Court, City, Country",
          phoneNumber: "+1234567894",
          dob: "1988-03-25",
          gender: "Male",
          password: hashedPassword,
          email: "user3@example.com",
          emailVerified: true,
          userStatus: "active",
          userRoles: "user",
          provider: "email",
          lastActive: new Date().toISOString(),
        },
      ])
      .returning();

    // Seed Coordinator Details
    console.log("👤 Seeding coordinator details...");
    await db.insert(coordinatorDetails).values([
      {
        userId: coordinatorUser.id,
        fullName: "Sarah Smith",
        phoneNumber: "+1234567891",
        bio: "Experienced travel coordinator with 10 years of expertise in adventure tours.",
        specialities: [
          "Mountain Hiking",
          "Cultural Tours",
          "Adventure Activities",
        ],
        languages: ["English", "Spanish", "French"],
        certificateLvl: "Advanced",
        yearsOfExperience: 10,
        type: "Professional",
        accessLvl: "Full",
        location: "San Francisco, CA",
        successRate: "98.5",
        repeatCustomers: 156,
        totalRevenue: "250000",
        isActive: true,
        notificationPref: {
          emailNotf: true,
          appAlert: true,
          reviewNotf: true,
        },
      },
    ]);

    // Seed Categories
    console.log("📁 Seeding categories...");
    await db.insert(categories).values([
      {
        name: "Mountain Adventures",
        isActive: true,
      },
      {
        name: "Beach & Water Sports",
        isActive: true,
      },
      {
        name: "Cultural Exploration",
        isActive: true,
      },
      {
        name: "Wellness & Relaxation",
        isActive: true,
      },
      {
        name: "Urban Discovery",
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
        question: "How do I join a trip?",
        answers:
          "You can join a trip by browsing available trips, viewing details, and submitting an application. The trip coordinator will review your application and send you a notification once approved.",
      },
      {
        question: "What is the difference between a user and a coordinator?",
        answers:
          "A coordinator has additional permissions to create and manage trips and chats, while a regular user can participate in trips they are invited to.",
      },
      {
        question: "How do I contact support?",
        answers:
          "You can contact support by sending a message in the Support chat or by emailing support@example.com.",
      },
      {
        question: "Can I get a refund for my trip?",
        answers:
          "Refund policies vary by trip. Please check the trip details or contact the coordinator for specific refund information.",
      },
    ]);

    // Seed Settings
    console.log("⚙️ Seeding settings...");
    await db.insert(globalSettings).values({
      platformName: "Proactive Travel",
      timeZone: "UTC",
      logo: "/logo.png",
      defaultLanguage: "en",
      currency: "USD",
      chatWidget: true,
      tripCategories: ["Mountain", "Beach", "Culture", "Adventure", "Wellness"],
      defaultApproval: "pending",
      defaultMaxParticipants: 20,
      defaultMinParticipants: 2,
      emailNotification: true,
      reminderDays: 3,
      sendSms: false,
      twoFactorEnabled: false,
      sessionTimeout: 30,
      maxLogins: 5,
      minPasswordLength: 8,
      contactAddress: "123 Travel Street, San Francisco, CA 94102, USA",
      contactPhone: "+1-800-TRAVEL-1",
      contactEmail: "contact@proactivetravel.com",
      mapLat: "40.7128",
      mapLng: "-74.0060",
    });

    // Seed Trips
    console.log("🚗 Seeding trips...");
    const [trip1, trip2, trip3, trip4] = await db
      .insert(trips)
      .values([
        {
          title: "Rocky Mountains Adventure",
          description:
            "An exciting week exploring the majestic Rocky Mountains",
          coverImage: "https://example.com/rocky-mountains.jpg",
          type: "Mountain",
          location: "Colorado, USA",
          mapCoordinates: "39.7392,-104.9903",
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
          duration: "7 days",
          longDesc:
            "Experience the breathtaking beauty of the Rocky Mountains with guided hikes, camping, and stunning views.",
          groupSize: "15",
          rhythm: "Active",
          sportLvl: "Intermediate",
          weekendTt: "Mountain",
          included: { hiking: true, camping: true, meals: true, guide: true },
          notIncluded: { flights: true, insurance: true },
          shortDesc: "Explore the majestic Rocky Mountains",
          instaLink: "https://www.instagram.com/rockymountains",
          likedinLink: "https://www.linkedin.com/company/rockymountains",
          promotionalVideo: "https://www.youtube.com/watch?v=rockymountains",
          galleryImages: [
            "https://example.com/img1.jpg",
            "https://example.com/img2.jpg",
            "https://example.com/img3.jpg",
          ],
          bestPriceMsg: "Book now and save 20%",
          perHeadPrice: "1500",
          status: "active",
          approvalStatus: "approved",
        },
        {
          title: "Hawaii Beach Paradise",
          description: "Relax on pristine beaches and explore tropical islands",
          coverImage: "https://example.com/hawaii-beach.jpg",
          type: "Beach",
          location: "Honolulu, Hawaii",
          mapCoordinates: "21.3099,-157.8581",
          startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 52 * 24 * 60 * 60 * 1000),
          duration: "7 days",
          longDesc:
            "Enjoy world-class beaches, water sports, local cuisine, and unforgettable sunsets in beautiful Hawaii.",
          groupSize: "20",
          rhythm: "Relaxed",
          sportLvl: "Easy",
          weekendTt: "Beach",
          included: {
            accommodation: true,
            meals: true,
            waterSports: true,
            guide: true,
          },
          notIncluded: { flights: true, activities: true },
          shortDesc: "Tropical beach paradise in Hawaii",
          instaLink: "https://www.instagram.com/hawaiibeach",
          likedinLink: "https://www.linkedin.com/company/hawaiitravel",
          promotionalVideo: "https://www.youtube.com/watch?v=hawaiibeach",
          galleryImages: [
            "https://example.com/beach1.jpg",
            "https://example.com/beach2.jpg",
          ],
          bestPriceMsg: "Early bird discount 15%",
          perHeadPrice: "2000",
          status: "active",
          approvalStatus: "approved",
        },
        {
          title: "Paris Cultural Tour",
          description:
            "Immerse yourself in art, history, and cuisine in the City of Light",
          coverImage: "https://example.com/paris-tour.jpg",
          type: "Culture",
          location: "Paris, France",
          mapCoordinates: "48.8566,2.3522",
          startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 67 * 24 * 60 * 60 * 1000),
          duration: "7 days",
          longDesc:
            "Visit iconic landmarks, world-class museums, enjoy fine dining, and experience authentic Parisian culture.",
          groupSize: "12",
          rhythm: "Moderate",
          sportLvl: "Easy",
          weekendTt: "Culture",
          included: {
            accommodation: true,
            tours: true,
            meals: true,
            guide: true,
          },
          notIncluded: { flights: true },
          shortDesc: "Experience the magic of Paris",
          instaLink: "https://www.instagram.com/paristours",
          likedinLink: "https://www.linkedin.com/company/parisculture",
          promotionalVideo: "https://www.youtube.com/watch?v=paris",
          galleryImages: [
            "https://example.com/paris1.jpg",
            "https://example.com/paris2.jpg",
          ],
          bestPriceMsg: "Limited spots available",
          perHeadPrice: "2500",
          status: "active",
          approvalStatus: "approved",
        },
        {
          title: "Thai Wellness Retreat",
          description:
            "Rejuvenate body and mind with yoga, meditation, and spa treatments",
          coverImage: "https://example.com/thailand-wellness.jpg",
          type: "Wellness",
          location: "Bangkok & Phuket, Thailand",
          mapCoordinates: "13.7563,100.5018",
          startDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 82 * 24 * 60 * 60 * 1000),
          duration: "7 days",
          longDesc:
            "Complete wellness package including yoga classes, spa treatments, healthy cuisine, and meditation sessions.",
          groupSize: "10",
          rhythm: "Relaxed",
          sportLvl: "Easy",
          weekendTt: "Wellness",
          included: { accommodation: true, yoga: true, spa: true, meals: true },
          notIncluded: { flights: true },
          shortDesc: "Wellness and relaxation in Thailand",
          instaLink: "https://www.instagram.com/thaiwellness",
          likedinLink: "https://www.linkedin.com/company/wellnessretreats",
          promotionalVideo: "https://www.youtube.com/watch?v=wellness",
          galleryImages: [
            "https://example.com/wellness1.jpg",
            "https://example.com/wellness2.jpg",
          ],
          bestPriceMsg: "All-inclusive package",
          perHeadPrice: "1800",
          status: "active",
          approvalStatus: "approved",
        },
      ])
      .returning();

    // Seed Trip Coordinators
    console.log("👥 Seeding trip coordinators...");
    await db.insert(tripCoordinators).values([
      {
        tripId: trip1.id,
        userId: coordinatorUser.id,
      },
      {
        tripId: trip2.id,
        userId: coordinatorUser.id,
      },
      {
        tripId: trip3.id,
        userId: coordinatorUser.id,
      },
      {
        tripId: trip4.id,
        userId: coordinatorUser.id,
      },
    ]);

    // Seed Chats
    console.log("💬 Seeding chats...");
    const [chat1, chat2, chat3] = await db
      .insert(chats)
      .values([
        {
          name: "General Discussion",
          description: "A general discussion chat for all users",
          coordinatorId: coordinatorUser.id,
          createdBy: coordinatorUser.id,
        },
        {
          name: "Rocky Mountains Group",
          description: "Chat for Rocky Mountains Adventure trip participants",
          coordinatorId: coordinatorUser.id,
          createdBy: coordinatorUser.id,
          tripId: trip1.id,
        },
        {
          name: "Hawaii Beach Lovers",
          description: "Chat for Hawaii Beach Paradise trip",
          coordinatorId: coordinatorUser.id,
          createdBy: coordinatorUser.id,
          tripId: trip2.id,
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
      {
        chatId: chat2.id,
        userId: regularUser3.id,
        role: "participant",
      },
      {
        chatId: chat3.id,
        userId: coordinatorUser.id,
        role: "admin",
      },
      {
        chatId: chat3.id,
        userId: regularUser2.id,
        role: "participant",
      },
    ]);

    // Seed Messages
    console.log("📨 Seeding messages...");
    await db.insert(messages).values([
      {
        chatId: chat1.id,
        senderId: coordinatorUser.id,
        content:
          "Welcome to the General Discussion chat! Feel free to introduce yourself and share your travel stories.",
      },
      {
        chatId: chat1.id,
        senderId: regularUser1.id,
        content: "Hello everyone! Excited to be part of this community!",
      },
      {
        chatId: chat1.id,
        senderId: regularUser2.id,
        content:
          "Hi! Looking forward to chatting with you all and planning future trips.",
      },
      {
        chatId: chat2.id,
        senderId: coordinatorUser.id,
        content:
          "Welcome to the Rocky Mountains group! Let's prepare for an amazing adventure!",
      },
      {
        chatId: chat2.id,
        senderId: regularUser1.id,
        content:
          "I'm so excited! This is my first mountain hiking trip. Any tips?",
      },
      {
        chatId: chat2.id,
        senderId: regularUser3.id,
        content:
          "Same here! I recommend bringing proper hiking boots and plenty of water.",
      },
      {
        chatId: chat3.id,
        senderId: coordinatorUser.id,
        content: "Aloha everyone! Ready for some beach time in paradise?",
      },
      {
        chatId: chat3.id,
        senderId: regularUser2.id,
        content: "Absolutely! Can't wait to relax on those beautiful beaches!",
      },
    ]);

    // Seed Payments
    console.log("💳 Seeding payments...");
    await db.insert(payments).values([
      {
        userId: regularUser1.id,
        tripId: trip1.id,
        amount: "1500",
        status: "paid",
        last4: "4242",
        currency: "USD",
        method: "credit_card",
        cardExpiry: "12/25",
        stripeCustomerId: "cus_sample_001",
        stripePaymentId: "pi_sample_001",
        membershipAvailable: true,
        discountAvailable: true,
        validTill: "2026-12-31",
      },
      {
        userId: regularUser2.id,
        tripId: trip2.id,
        amount: "2000",
        status: "paid",
        last4: "5555",
        currency: "USD",
        method: "credit_card",
        cardExpiry: "06/26",
        stripeCustomerId: "cus_sample_002",
        stripePaymentId: "pi_sample_002",
        membershipAvailable: false,
        discountAvailable: false,
      },
      {
        userId: regularUser3.id,
        tripId: trip1.id,
        amount: "1500",
        status: "pending",
        currency: "USD",
        method: "credit_card",
        stripeCustomerId: "cus_sample_003",
        stripePaymentId: "pi_sample_003",
        membershipAvailable: false,
        discountAvailable: true,
      },
    ]);

    // Seed Discounts
    console.log("🎟️ Seeding discounts...");
    await db.insert(discounts).values([
      {
        tripId: trip1.id,
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "active",
        discountCode: "EARLYBIRD20",
        description: "20% off for early bookings",
        discountPercentage: 20,
        maxUsage: "50",
        amount: "300",
      },
      {
        tripId: trip2.id,
        validTill: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: "active",
        discountCode: "SUMMER15",
        description: "15% summer discount",
        discountPercentage: 15,
        maxUsage: "100",
        amount: "300",
      },
      {
        tripId: trip3.id,
        validTill: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: "expired",
        discountCode: "EXPIRED10",
        description: "Expired discount",
        discountPercentage: 10,
        maxUsage: "0",
        amount: "0",
      },
    ]);

    // Seed Applications
    console.log("📝 Seeding applications...");
    await db.insert(applications).values([
      {
        userId: regularUser1.id,
        tripId: trip1.id,
        shortIntro:
          "I'm an experienced hiker looking for adventure in the mountains.",
        dietaryRestrictions: "Vegetarian",
        introVideo: "https://example.com/video1.mp4",
        status: "approved",
      },
      {
        userId: regularUser2.id,
        tripId: trip2.id,
        shortIntro:
          "Beach lover seeking relaxation and water sports activities.",
        dietaryRestrictions: "None",
        introVideo: "https://example.com/video2.mp4",
        status: "approved",
      },
      {
        userId: regularUser3.id,
        tripId: trip1.id,
        shortIntro:
          "First time hiking, but very enthusiastic and ready to learn!",
        dietaryRestrictions: "Gluten-free",
        introVideo: "https://example.com/video3.mp4",
        status: "pending",
      },
    ]);

    // Seed Reviews
    console.log("⭐ Seeding reviews...");
    await db.insert(reviews).values([
      {
        userId: regularUser1.id,
        tripId: trip1.id,
        rating: 5,
        review:
          "Absolutely fantastic experience! The views were breathtaking and the coordinator was very professional.",
      },
      {
        userId: regularUser2.id,
        tripId: trip2.id,
        rating: 4,
        review:
          "Great trip! Beautiful beaches and good food. Would have appreciated more free time to explore.",
      },
      {
        userId: regularUser3.id,
        tripId: trip1.id,
        rating: 5,
        review:
          "This was my first hiking trip and it was amazing! Made new friends and learned so much.",
      },
    ]);

    // Seed Achievements
    console.log("🏆 Seeding achievements...");
    await db.insert(achievements).values([
      {
        userId: regularUser1.id,
        tripId: trip1.id,
        points: 100,
        progress: 100,
        level: "Gold",
        badges: "Mountain Climber",
        unlocked: true,
        role: "participant",
      },
      {
        userId: regularUser2.id,
        tripId: trip2.id,
        points: 75,
        progress: 75,
        level: "Silver",
        badges: "Nature Lover",
        unlocked: true,
        role: "participant",
      },
      {
        userId: regularUser3.id,
        tripId: trip1.id,
        points: 50,
        progress: 50,
        level: "Bronze",
        badges: "Culture Explorer",
        unlocked: false,
        role: "participant",
      },
      {
        userId: coordinatorUser.id,
        tripId: trip1.id,
        points: 200,
        progress: 100,
        level: "Platinum",
        badges: "Leader",
        unlocked: true,
        role: "coordinator",
      },
    ]);

    // Seed Notifications
    console.log("🔔 Seeding notifications...");
    await db.insert(notifications).values([
      {
        userId: regularUser1.id,
        title: "Trip Application Approved",
        description:
          "Your application for Rocky Mountains Adventure has been approved!",
        type: "application",
        read: true,
      },
      {
        userId: regularUser2.id,
        title: "Trip Reminder",
        description:
          "Your Hawaii Beach Paradise trip starts in 10 days. Don't forget to pack!",
        type: "reminder",
        read: false,
      },
      {
        userId: regularUser3.id,
        title: "Payment Received",
        description:
          "We received your payment for Rocky Mountains Adventure trip.",
        type: "payment",
        read: true,
      },
      {
        userId: coordinatorUser.id,
        title: "New Application",
        description:
          "You have a new application for Rocky Mountains Adventure trip.",
        type: "application",
        read: false,
      },
      {
        userId: regularUser1.id,
        title: "Review Request",
        description: "Please share your experience from your recent trip!",
        type: "review",
        read: false,
      },
    ]);

    // Seed Newsletter Subscribers
    console.log("📧 Seeding newsletter subscribers...");
    try {
      await db.insert(newsletterSubscribers).values([
        {
          email: "subscriber1@example.com",
        },
        {
          email: "subscriber2@example.com",
        },
        {
          email: "subscriber3@example.com",
        },
        {
          email: "user1@example.com",
        },
        {
          email: "user2@example.com",
        },
      ]);
    } catch (e) {
      console.log(
        "   ⚠️  Newsletter subscribers table not yet created, skipping...",
      );
    }

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📊 Seeded data summary:");
    console.log(`   - Users: 5 (1 admin, 1 coordinator, 3 regular users)`);
    console.log(`   - Coordinator Details: 1`);
    console.log(`   - Categories: 5`);
    console.log(`   - FAQs: 5`);
    console.log(`   - Settings: 1`);
    console.log(`   - Trips: 4`);
    console.log(`   - Trip Coordinators: 4`);
    console.log(`   - Chats: 3`);
    console.log(`   - Chat Participants: 8`);
    console.log(`   - Messages: 8`);
    console.log(`   - Payments: 3`);
    console.log(`   - Discounts: 3`);
    console.log(`   - Applications: 3`);
    console.log(`   - Reviews: 3`);
    console.log(`   - Achievements: 4`);
    console.log(`   - Notifications: 5`);
    console.log(`   - Newsletter Subscribers: 5`);
    console.log("\n🔑 Default password for all users: Password123!");
    console.log(
      "📧 Default emails: admin@example.com, coordinator@example.com, user1@example.com, user2@example.com, user3@example.com",
    );
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
    console.error(
      "   4. Use the direct connection string (not pooler) from Supabase dashboard",
    );
    console.error(
      "   5. Try running: npm run dbpush (to ensure schema is up to date)",
    );

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
