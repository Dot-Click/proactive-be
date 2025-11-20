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
      },
    },
  },
  apis: [
    route("auth.routes.ts"),
    route("chat.routes.ts"),
    route("faq.routes.ts"),
    route("category.routes.ts"),
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
