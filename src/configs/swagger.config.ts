import swaggerJSDOC, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { config } from "dotenv";
import path from "path";
config();

const route = (routeFile: string) => path.join("./src/routes/", routeFile);
const routeController = (controllerFile: string) =>
  path.join("./src/controllers/auth/", controllerFile);

const options: Options = {
  definition: {
    // Using 'definition' for OpenAPI 3.0 (swagger-jsdoc v6+)
    openapi: "3.0.0",
    info: {
      title: "Proactive API",
      version: "1.0.0",
      description:
        "Proactive backend API documentation with authentication endpoints",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.proactive.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "FAQs",
        description: "FAQ management endpoints",
      },
      {
        name: "Categories",
        description: "Category management endpoints",
      },
      {
        name: "Trips",
        description: "Trip management endpoints",
      },
      {
        name: "Payment",
        description: "Payment and membership management endpoints",
      },
      {
        name: "Admin",
        description: "Admin endpoints for managing coordinators and settings",
      },
      {
        name: "Applications",
        description: "Application submission and management endpoints",
      },
      {
        name: "User",
        description: "User endpoints for Instagram info and reviews",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter JWT token obtained from login or register endpoint. Format: Bearer {token}",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "An error occurred",
            },
            error: {
              type: "string",
            },
            errors: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "password", "role"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "Password123",
              description:
                "Password must be at least 8 characters and contain uppercase, lowercase, and number",
            },
            role: {
              type: "string",
              enum: ["user", "coordinator"],
              example: "user",
            },
          },
        },
        CreateCoordinatorRequest: {
          type: "object",
          required: ["coordinatorDetails", "email", "password"],
          properties: {
            coordinatorDetails: {
              type: "object",
              description: "Coordinator details object. Can be sent as JSON string in multipart/form-data or as object in application/json",
              properties: {
                fullName: {
                  type: "string",
                  example: "John Doe",
                  description: "Coordinator's full name",
                },
                phoneNumber: {
                  type: "string",
                  example: "+1234567890",
                  description: "Coordinator's phone number",
                },
                bio: {
                  type: "string",
                  example: "Experienced program coordinator with a background in education and project management.",
                  description: "Coordinator's biography",
                },
                specialities: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["Adventure Travel", "Group Management", "Safety"],
                  description: "List of coordinator's specialities",
                },
                languages: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["English", "Spanish", "French"],
                  description: "List of languages the coordinator speaks",
                },
                certificateLvl: {
                  type: "string",
                  example: "Level 2",
                  description: "Certificate level",
                },
                yearsOfExperience: {
                  type: "integer",
                  example: 5,
                  description: "Years of experience",
                },
                type: {
                  type: "string",
                  example: "senior-coordinator",
                  description: "Type of coordinator",
                },
                accessLvl: {
                  type: "string",
                  example: "admin",
                  description: "Access level",
                },
              },
              required: ["fullName", "phoneNumber", "bio", "specialities", "languages", "certificateLvl", "yearsOfExperience", "type", "accessLvl"],
            },
            email: {
              type: "string",
              format: "email",
              example: "coordinator@example.com",
              description: "Coordinator's email address (will be used for login)",
            },
            password: {
              type: "string",
              format: "password",
              example: "StrongPass123!",
              description: "Password for the coordinator account",
            },
            prof_pic: {
              type: "string",
              format: "binary",
              description: "Profile picture file (optional, accepts image/jpeg, image/png, image/jpg)",
            },
          },
        },
        Coordinator: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123abc456def789",
              description: "Coordinator details ID",
            },
            userId: {
              type: "string",
              example: "clx123abc456def789",
              description: "Associated user ID",
            },
            fullName: {
              type: "string",
              example: "John Doe",
              description: "Coordinator's full name",
            },
            phoneNumber: {
              type: "string",
              example: "+1234567890",
              description: "Coordinator's phone number",
            },
            bio: {
              type: "string",
              example: "Experienced program coordinator with a background in education and project management.",
              description: "Coordinator's biography",
            },
            profilePicture: {
              type: "string",
              format: "uri",
              nullable: true,
              example: "https://example.com/images/jane-doe.jpg",
              description: "URL to coordinator's profile picture",
            },
            specialities: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["Adventure Travel", "Group Management", "Safety"],
              description: "List of coordinator's specialities",
            },
            languages: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["English", "Spanish", "French"],
              description: "List of languages the coordinator speaks",
            },
            certificateLvl: {
              type: "string",
              example: "Level 2",
              description: "Certificate level",
            },
            yearsOfExperience: {
              type: "integer",
              example: 5,
              description: "Years of experience",
            },
            type: {
              type: "string",
              example: "senior-coordinator",
              description: "Type of coordinator",
            },
            accessLvl: {
              type: "string",
              example: "admin",
              description: "Access level",
            },
            email: {
              type: "string",
              format: "email",
              example: "coordinator@example.com",
              description: "Coordinator's email address (from users table)",
            },
            emailVerified: {
              type: "boolean",
              example: true,
              description: "Whether the email is verified",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-12-20T00:00:00.000Z",
              description: "Coordinator details creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2025-12-20T00:00:00.000Z",
              description: "Coordinator details last update timestamp",
            },
            userCreatedAt: {
              type: "string",
              format: "date-time",
              example: "2025-12-20T00:00:00.000Z",
              description: "User account creation timestamp",
            },
          },
        },
        CoordinatorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Coordinator fetched successfully",
            },
            data: {
              type: "object",
              properties: {
                coordinator: {
                  $ref: "#/components/schemas/Coordinator",
                },
              },
            },
          },
        },
        CoordinatorsListResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Coordinators fetched successfully",
            },
            data: {
              type: "object",
              properties: {
                coordinators: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Coordinator",
                  },
                },
              },
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "Password123",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Login successful",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                    },
                    email: {
                      type: "string",
                    },
                    role: {
                      type: "string",
                    },
                    emailVerified: {
                      type: "boolean",
                    },
                  },
                },
                accessToken: {
                  type: "string",
                  description: "JWT access token (expires in 15 minutes)",
                },
              },
            },
          },
        },
        CreateFaqRequest: {
          type: "object",
          required: ["question", "answers"],
          properties: {
            question: {
              type: "string",
              minLength: 1,
              maxLength: 1000,
              example: "What is the return policy?",
              description: "The FAQ question",
            },
            answers: {
              type: "string",
              minLength: 1,
              maxLength: 5000,
              example:
                "Our return policy allows returns within 30 days of purchase.",
              description: "The FAQ answer",
            },
          },
        },
        UpdateFaqRequest: {
          type: "object",
          properties: {
            question: {
              type: "string",
              minLength: 1,
              maxLength: 1000,
              example: "What is the updated return policy?",
              description: "The FAQ question (optional)",
            },
            answers: {
              type: "string",
              minLength: 1,
              maxLength: 5000,
              example:
                "Our updated return policy allows returns within 45 days of purchase.",
              description: "The FAQ answer (optional)",
            },
          },
        },
        Faq: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx1234567890",
              description: "Unique FAQ identifier",
            },
            question: {
              type: "string",
              example: "What is the return policy?",
              description: "The FAQ question",
            },
            answers: {
              type: "string",
              example:
                "Our return policy allows returns within 30 days of purchase.",
              description: "The FAQ answer",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00Z",
              description: "FAQ creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00Z",
              description: "FAQ last update timestamp",
            },
          },
        },
        FaqsResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "FAQs retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                faqs: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Faq",
                  },
                },
              },
            },
          },
        },
        FaqResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "FAQ retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                faq: {
                  $ref: "#/components/schemas/Faq",
                },
              },
            },
          },
        },
        CreateCategoryRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              example: "Electronics",
              description: "The category name",
            },
            isActive: {
              type: "boolean",
              default: true,
              example: true,
              description: "Whether the category is active",
            },
          },
        },
        UpdateCategoryRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              example: "Updated Electronics",
              description: "The category name (optional)",
            },
            isActive: {
              type: "boolean",
              example: false,
              description: "Whether the category is active (optional)",
            },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx1234567890",
              description: "Unique category identifier",
            },
            name: {
              type: "string",
              example: "Electronics",
              description: "The category name",
            },
            isActive: {
              type: "boolean",
              example: true,
              description: "Whether the category is active",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00Z",
              description: "Category creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00Z",
              description: "Category last update timestamp",
            },
          },
        },
        CategoriesResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Categories retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Category",
                  },
                },
              },
            },
          },
        },
        CategoryResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Category retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                category: {
                  $ref: "#/components/schemas/Category",
                },
              },
            },
          },
        },
        Trip: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "j1kwhiwkamn0e8tk5xz4srct",
              description: "Unique trip identifier",
            },
            title: {
              type: "string",
              example: "Adventure Trip to Morocco",
              description: "The trip title",
            },
            description: {
              type: "string",
              example: "Experience the vibrant culture and stunning landscapes of Morocco",
              description: "The trip description",
            },
            coverImage: {
              type: "string",
              format: "uri",
              example: "https://placeholder.com/uploads/trip1-DVzyU79l.png",
              description: "The trip cover image URL",
            },
            type: {
              type: "string",
              example: "Wild Weekend",
              description: "The trip type",
            },
            location: {
              type: "string",
              example: "Barcelona, Spain",
              description: "The trip location",
            },
            mapCoordinates: {
              type: "string",
              example: "41.3825802,2.1770730",
              description: "The trip map coordinates (latitude,longitude)",
            },
            startDate: {
              type: "string",
              format: "date-time",
              example: "2024-12-25T00:00:00.000Z",
              description: "The trip start date",
            },
            endDate: {
              type: "string",
              format: "date-time",
              example: "2024-12-30T00:00:00.000Z",
              description: "The trip end date",
            },
            duration: {
              type: "string",
              example: "7 days",
              description: "The trip duration",
            },
            longDesc: {
              type: "string",
              example: "",
              description: "The trip long description",
            },
            groupSize: {
              type: "string",
              example: "",
              description: "The trip group size",
            },
            rhythm: {
              type: "string",
              example: "Moderate",
              description: "The trip rhythm",
            },
            sportLvl: {
              type: "string",
              example: "",
              description: "The trip sport level",
            },
            weekendTt: {
              type: "string",
              format: "uri",
              example: "https://placeholder.com/uploads/5hcaq2.jpg",
              description: "The trip weekend timetable image URL",
            },
            included: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  img: {
                    type: "string",
                    format: "uri",
                    example: "https://res.cloudinary.com/doo6wulo2/image/upload/v1765321563/contactusimg_z3qfnw.png",
                  },
                  title: {
                    type: "string",
                    example: "check",
                  },
                  description: {
                    type: "string",
                    example: "hehehe",
                  },
                },
                required: ["img", "title", "description"],
              },
            },
            status: {
              type: "string",
              enum: ["pending", "active", "completed", "cancelled"],
              example: "pending",
              description: "The trip status",
            },
            notIncluded: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  img: {
                    type: "string",
                    format: "uri",
                  },
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                },
                required: ["img", "title", "description"],
              },
            },
            shortDesc: {
              type: "string",
              example: "",
              description: "The trip short description",
            },
            instaLink: {
              type: "string",
              format: "uri",
              nullable: true,
              example: null,
              description: "The trip instagram link",
            },
            likedinLink: {
              type: "string",
              format: "uri",
              nullable: true,
              example: null,
              description: "The trip linkedin link",
            },
            promotionalVideo: {
              type: "string",
              format: "uri",
              example: "https://placeholder.com/uploads/video1.mp4",
              description: "The trip promotional video URL",
            },
            galleryImages: {
              type: "array",
              items: {
                type: "string",
                format: "uri",
              },
              example: [
                "https://placeholder.com/uploads/detailtrip1-D55mxc9M.png",
                "https://placeholder.com/uploads/detailtrip2-DkPK3tQE.png",
                "https://placeholder.com/uploads/detailtrip3-BrR-grLz.png",
              ],
              description: "Array of gallery image URLs",
            },
            bestPriceMsg: {
              type: "string",
              example: "",
              description: "The trip best price message",
            },
            perHeadPrice: {
              type: "string",
              example: "",
              description: "The trip per head price",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-12-18T00:27:28.969Z",
              description: "The trip creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2025-12-18T00:27:28.138Z",
              description: "The trip last update timestamp",
            },
          },
        },
        TripResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Trip created successfully",
            },
            data: {
              type: "object",
              properties: {
                trip: {
                  $ref: "#/components/schemas/Trip",
                },
              },
            },
          },
        },
        CreateTripRequest: {
          type: "object",
          required: ["title", "description", "location", "startDate", "endDate", "duration"],
          properties: {
            title: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              example: "Adventure Trip to Morocco",
              description: "The trip title",
            },
            description: {
              type: "string",
              minLength: 1,
              maxLength: 1000,
              example: "Experience the vibrant culture and stunning landscapes of Morocco",
              description: "The trip description",
            },
            cover_img: {
              type: "string",
              format: "binary",
              description: "Cover image file",
            },
            type: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              example: "Wild Weekend",
              description: "The trip type",
            },
            location: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              example: "Barcelona, Spain",
              description: "The trip location",
            },
            map_coordinates: {
              type: "string",
              example: "31.6295,-7.9811",
              description: "Map coordinates in format 'latitude,longitude'",
            },
            startDate: {
              type: "string",
              format: "date",
              example: "2024-12-25",
              description: "The trip start date (YYYY-MM-DD)",
            },
            endDate: {
              type: "string",
              format: "date",
              example: "2024-12-30",
              description: "The trip end date (YYYY-MM-DD)",
            },
            duration: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              example: "7 days",
              description: "The trip duration",
            },
            long_desc: {
              type: "string",
              example: "Join us for an unforgettable 7-day adventure through Morocco. Explore the bustling souks of Marrakech, trek through the Atlas Mountains, and experience the magic of the Sahara Desert.",
              description: "The trip long description",
            },
            group_size: {
              type: "string",
              example: "10-15 people",
              description: "The trip group size",
            },
            rhythm: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              example: "Moderate",
              description: "The trip rhythm",
            },
            sport_lvl: {
              type: "string",
              example: "Intermediate",
              description: "The trip sport level",
            },
            tt_img: {
              type: "string",
              format: "binary",
              description: "Weekend timetable image file",
            },
            included: {
              type: "string",
              example: '[{"title":"check","description":"hehehe","img":"https://res.cloudinary.com/doo6wulo2/image/upload/v1765321563/contactusimg_z3qfnw.png"}]',
              description: "JSON string array of included items with title, description, and img",
            },
            not_included: {
              type: "string",
              example: '[{"title":"check","description":"hehehe","img":"https://res.cloudinary.com/doo6wulo2/image/upload/v1765321563/contactusimg_z3qfnw.png"}]',
              description: "JSON string array of not included items with title, description, and img",
            },
            discounts: {
              type: "string",
              example: '{"discount_code":"DIS_7722","discount_percentage":"10%","amount":"226","valid_till":"21/09/2025","description":"ac..."}',
              description: "JSON string or object with discount information",
            },
            short_desc: {
              type: "string",
              example: "7-day adventure through Morocco's most iconic destinations",
              description: "The trip short description",
            },
            promotional_video: {
              type: "string",
              format: "binary",
              description: "Promotional video file",
            },
            coordinators: {
              type: "string",
              example: '["ew5dhm5kade4zuz5546qqjkh"]',
              description: "JSON string array of coordinator user IDs",
            },
            gallery_images: {
              type: "array",
              items: {
                type: "string",
                format: "binary",
              },
              description: "Array of gallery image files",
            },
            insta_link: {
              type: "string",
              format: "uri",
              example: "https://instagram.com/proactive_trips",
              description: "The trip instagram link",
            },
            likedin_link: {
              type: "string",
              format: "uri",
              example: "https://linkedin.com/company/proactive-trips",
              description: "The trip linkedin link",
            },
            best_price_msg: {
              type: "string",
              example: "Book now and save 15%! Early bird discount available until March 31st.",
              description: "The trip best price message",
            },
            per_head_price: {
              type: "string",
              example: "$1,299",
              description: "The trip per head price",
            },
          },
        },
        PaymentRequest: {
          type: "object",
          required: ["payment_method_id"],
          properties: {
            payment_method_id: {
              type: "string",
              example: "pm_1ABC123def456GHI789jkl",
              description: "The Stripe payment method ID",
            },
            amount: {
              type: "number",
              example: 950.0,
              description: "The amount to charge (default: 950.0)",
            },
            currency: {
              type: "string",
              example: "eur",
              default: "eur",
              description: "The currency code (default: eur)",
            },
            return_url: {
              type: "string",
              format: "uri",
              example: "https://example.com/payment/return",
              description: "The URL to redirect to after payment completion",
            },
            trip_id: {
              type: "string",
              example: "clx123abc456def789",
              description: "Optional trip ID associated with the payment",
            },
          },
        },
        MembershipRequest: {
          type: "object",
          required: ["payment_method_id", "membership_type"],
          properties: {
            payment_method_id: {
              type: "string",
              example: "pm_1ABC123def456GHI789jkl",
              description: "The Stripe payment method ID",
            },
            amount: {
              type: "number",
              example: 950.0,
              description: "The amount to charge",
            },
            currency: {
              type: "string",
              example: "eur",
              default: "eur",
              description: "The currency code (default: eur)",
            },
            return_url: {
              type: "string",
              format: "uri",
              example: "https://example.com/payment/return",
              description: "The URL to redirect to after payment completion",
            },
            membership_type: {
              type: "string",
              example: "premium",
              description: "The type of membership",
            },
          },
        },
        PaymentResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Payment processed successfully",
            },
            data: {
              type: "object",
              properties: {
                paymentIntentId: {
                  type: "string",
                  example: "clx123abc456def789",
                  description: "The payment ID",
                },
                stripePaymentIntentId: {
                  type: "string",
                  example: "pi_1ABC123def456GHI789jkl",
                  description: "The Stripe payment intent ID",
                },
                customerId: {
                  type: "string",
                  example: "cus_1ABC123def456GHI789jkl",
                  description: "The Stripe customer ID",
                },
                status: {
                  type: "string",
                  enum: ["paid", "unpaid", "pending", "failed", "refunded"],
                  example: "paid",
                  description: "The payment status",
                },
                amount: {
                  type: "number",
                  example: 950.0,
                  description: "The payment amount",
                },
                currency: {
                  type: "string",
                  example: "EUR",
                  description: "The payment currency",
                },
              },
            },
          },
        },
        MembershipResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Membership created successfully",
            },
            data: {
              type: "object",
              properties: {
                membershipId: {
                  type: "string",
                  example: "PA-123456",
                  description: "The membership ID",
                },
                paymentId: {
                  type: "string",
                  example: "clx123abc456def789",
                  description: "The payment ID",
                },
                stripePaymentIntentId: {
                  type: "string",
                  example: "pi_1ABC123def456GHI789jkl",
                  description: "The Stripe payment intent ID",
                },
                customerId: {
                  type: "string",
                  example: "cus_1ABC123def456GHI789jkl",
                  description: "The Stripe customer ID",
                },
                status: {
                  type: "string",
                  enum: ["paid", "unpaid", "pending", "failed", "refunded"],
                  example: "paid",
                  description: "The payment status",
                },
                membershipType: {
                  type: "string",
                  example: "premium",
                  description: "The membership type",
                },
                membershipExpiry: {
                  type: "string",
                  format: "date-time",
                  example: "2025-12-31T23:59:59.000Z",
                  description: "The membership expiry date (1 year from creation)",
                },
                amount: {
                  type: "number",
                  example: 950.0,
                  description: "The payment amount",
                },
                currency: {
                  type: "string",
                  example: "EUR",
                  description: "The payment currency",
                },
                membershipAvailable: {
                  type: "boolean",
                  example: true,
                  description: "Whether the membership is available",
                },
              },
            },
          },
        },
        PaymentsListResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Payments retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                tripPayments: {
                  type: "array",
                  items: {
                    type: "object",
                  },
                },
                membershipPayments: {
                  type: "object",
                  properties: {
                    payments: {
                      type: "array",
                      items: {
                        type: "object",
                      },
                    },
                    keyStates: {
                      type: "object",
                      properties: {
                        totalActiveMemberships: {
                          type: "integer",
                          example: 134,
                        },
                        expiringSoon: {
                          type: "integer",
                          example: 25,
                        },
                        averageDuration: {
                          type: "string",
                          example: "365 days",
                        },
                        monthlyRenewals: {
                          type: "integer",
                          example: 18,
                        },
                      },
                    },
                  },
                },
                discounts: {
                  type: "array",
                  items: {
                    type: "object",
                  },
                },
              },
            },
          },
        },
        Application: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123abc456def789",
              description: "Unique application identifier",
            },
            userId: {
              type: "string",
              example: "clx123abc456def789",
              description: "User ID who submitted the application",
            },
            tripId: {
              type: "string",
              example: "clx123abc456def789",
              description: "Trip ID the application is for",
            },
            shortIntro: {
              type: "string",
              example: "I am a 20 year old male from the United States.",
              description: "Short introduction about the applicant",
            },
            introVideo: {
              type: "string",
              format: "uri",
              example: "https://cloudinary.com/video/upload/v1234567890/intro.mp4",
              description: "URL to the introduction video",
            },
            dietaryRestrictions: {
              type: "string",
              nullable: true,
              example: "I am a vegetarian.",
              description: "Dietary restrictions or preferences",
            },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected", "cancelled"],
              example: "pending",
              description: "Application status",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00Z",
              description: "Application creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2024-01-15T10:30:00Z",
              description: "Application last update timestamp",
            },
          },
        },
        ApplicationResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Application submitted successfully",
            },
            data: {
              type: "object",
              properties: {
                application: {
                  $ref: "#/components/schemas/Application",
                },
              },
            },
          },
        },
        CreateApplicationRequest: {
          type: "object",
          required: ["tripId", "shortIntro", "introVideo"],
          properties: {
            tripId: {
              type: "string",
              minLength: 1,
              example: "clx123abc456def789",
              description: "Trip ID to apply for",
            },
            shortIntro: {
              type: "string",
              minLength: 1,
              example: "I am a 20 year old male from the United States.",
              description: "Short introduction about yourself",
            },
            introVideo: {
              type: "string",
              format: "uri",
              example: "https://cloudinary.com/video/upload/v1234567890/intro.mp4",
              description: "URL to introduction video",
            },
            dietaryRestrictions: {
              type: "string",
              nullable: true,
              example: "I am a vegetarian.",
              description: "Dietary restrictions or preferences (optional)",
            },
          },
        },
        InstagramInfo: {
          type: "object",
          properties: {
            user: {
              type: "object",
              nullable: true,
              properties: {
                username: {
                  type: "string",
                  example: "proactivefuture_eu",
                },
                full_name: {
                  type: "string",
                  example: "Proactive Future",
                },
                profile_pic_url: {
                  type: "string",
                  format: "uri",
                  example: "https://instagram.com/pic.jpg",
                },
                profile_link: {
                  type: "string",
                  format: "uri",
                  example: "https://www.instagram.com/proactivefuture_eu/",
                },
              },
            },
            posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    example: "123456789",
                  },
                  code: {
                    type: "string",
                    example: "ABC123",
                  },
                  caption: {
                    type: "string",
                    example: "Amazing adventure!",
                  },
                  taken_at: {
                    type: "integer",
                    example: 1234567890,
                  },
                  thumbnail_url: {
                    type: "string",
                    format: "uri",
                    nullable: true,
                    example: "https://instagram.com/image.jpg",
                  },
                  link: {
                    type: "string",
                    format: "uri",
                    example: "https://www.instagram.com/p/ABC123/",
                  },
                  like_count: {
                    type: "integer",
                    example: 150,
                  },
                  comment_count: {
                    type: "integer",
                    example: 25,
                  },
                },
              },
            },
          },
        },
        InstagramResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Insta info fetched successfully",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/InstagramInfo/properties/user",
                },
                posts: {
                  $ref: "#/components/schemas/InstagramInfo/properties/posts",
                },
              },
            },
          },
        },
        Review: {
          type: "object",
          properties: {
            link: {
              type: "string",
              format: "uri",
              example: "https://www.google.com/maps/review/123",
            },
            userImage: {
              type: "string",
              format: "uri",
              nullable: true,
              example: "https://lh3.googleusercontent.com/photo.jpg",
            },
            userName: {
              type: "string",
              example: "John Doe",
            },
            review: {
              type: "string",
              example: "Great experience! Highly recommended.",
            },
          },
        },
        ReviewsResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Reviews fetched successfully",
            },
            data: {
              type: "object",
              properties: {
                reviews: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Review",
                  },
                },
              },
            },
          },
        },
        Settings: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123abc456def789",
              description: "Settings ID",
            },
            platformName: {
              type: "string",
              example: "Proactive Future",
              description: "Platform name",
            },
            timeZone: {
              type: "string",
              example: "Europe/Berlin",
              description: "Platform timezone",
            },
            logo: {
              type: "string",
              format: "uri",
              example: "https://cloudinary.com/image/upload/logo.png",
              description: "Platform logo URL",
            },
            defaultLanguage: {
              type: "string",
              example: "en",
              description: "Default language code",
            },
            currency: {
              type: "string",
              example: "EUR",
              description: "Default currency",
            },
            chatWidget: {
              type: "boolean",
              example: true,
              description: "Whether chat widget is enabled",
            },
            tripCategories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    example: "clx123abc456def789",
                  },
                  name: {
                    type: "string",
                    example: "Adventure",
                  },
                  description: {
                    type: "string",
                    nullable: true,
                    example: "Adventure trips",
                  },
                  enabled: {
                    type: "boolean",
                    nullable: true,
                    example: true,
                  },
                },
              },
              description: "Array of trip categories",
            },
            defaultApproval: {
              type: "string",
              example: "automatic",
              description: "Default approval method",
            },
            defaultMaxParticipants: {
              type: "integer",
              example: 20,
              description: "Default maximum participants",
            },
            defaultMinParticipants: {
              type: "integer",
              example: 5,
              description: "Default minimum participants",
            },
            emailNotification: {
              type: "boolean",
              example: true,
              description: "Whether email notifications are enabled",
            },
            reminderDays: {
              type: "integer",
              example: 7,
              description: "Days before trip to send reminder",
            },
            sendSms: {
              type: "boolean",
              example: false,
              description: "Whether SMS notifications are enabled",
            },
            twoFactorEnabled: {
              type: "boolean",
              example: true,
              description: "Whether two-factor authentication is enabled",
            },
            sessionTimeout: {
              type: "integer",
              example: 3600,
              description: "Session timeout in seconds",
            },
            maxLogins: {
              type: "integer",
              example: 5,
              description: "Maximum concurrent logins",
            },
            minPasswordLength: {
              type: "integer",
              example: 8,
              description: "Minimum password length",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2024-01-15T10:30:00Z",
            },
          },
        },
        SettingsResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Settings fetched successfully",
            },
            data: {
              type: "object",
              properties: {
                settings: {
                  $ref: "#/components/schemas/Settings",
                },
              },
            },
          },
        },
        UpdateSettingsRequest: {
          type: "object",
          properties: {
            platformName: {
              type: "string",
              maxLength: 255,
              example: "Proactive Future",
            },
            timeZone: {
              type: "string",
              maxLength: 100,
              example: "Europe/Berlin",
            },
            logo: {
              type: "string",
              format: "binary",
              description: "Logo image file (optional)",
            },
            defaultLanguage: {
              type: "string",
              maxLength: 50,
              example: "en",
            },
            currency: {
              type: "string",
              maxLength: 10,
              example: "EUR",
            },
            chatWidget: {
              type: "boolean",
              example: true,
            },
            tripCategories: {
              type: "string",
              example: '[{"name":"Adventure","description":"Adventure trips"}]',
              description: "JSON string array of trip categories (id will be auto-generated)",
            },
            defaultApproval: {
              type: "string",
              maxLength: 50,
              example: "automatic",
            },
            defaultMaxParticipants: {
              type: "integer",
              example: 20,
            },
            defaultMinParticipants: {
              type: "integer",
              example: 5,
            },
            emailNotification: {
              type: "boolean",
              example: true,
            },
            reminderDays: {
              type: "integer",
              example: 7,
            },
            sendSms: {
              type: "boolean",
              example: false,
            },
            twoFactorEnabled: {
              type: "boolean",
              example: true,
            },
            sessionTimeout: {
              type: "integer",
              example: 3600,
            },
            maxLogins: {
              type: "integer",
              example: 5,
            },
            minPasswordLength: {
              type: "integer",
              example: 8,
            },
          },
        },
      },
    },
  },
  apis: [
    route("auth.routes.ts"),
    route("chat.routes.ts"),
    route("faq.routes.ts"),
    route("category.routes.ts"),
    route("trip.routes.ts"),
    route("payment.routes.ts"),
    route("admin.routes.ts"),
    route("user.routes.ts"),
    route("coordinator.routes.ts"),
    route("example.routes.ts"),
    "./src/controllers/user/applications.submit.controller.ts",
    "./src/controllers/user/insta&reviews.controller.ts",
    "./src/controllers/coordinators/get.all.applications.ts",
  ],
};

export const swaggerSpec = swaggerJSDOC(options);

export const swagger = (app: Express) => {
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true, // Persist authorization across page refreshes
      displayRequestDuration: true, // Show request duration
      filter: true, // Enable filtering
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true, // Enable "Try it out" by default
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
    `,
    customSiteTitle: "Proactive API Documentation",
  };

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerOptions)
  );
  app.get("/api/docs-json", (_, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};
