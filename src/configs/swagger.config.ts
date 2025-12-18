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
      },
    },
  },
  apis: [
    route("auth.routes.ts"),
    route("chat.routes.ts"),
    route("faq.routes.ts"),
    route("category.routes.ts"),
    route("trip.routes.ts"),
    route("example.routes.ts"),
    routeController("*.controller.ts"),
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
