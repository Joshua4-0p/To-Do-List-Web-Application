const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Todo API",
    version: "1.0.0",
    description:
      "A RESTful API for a Todo List application with user authentication and task management",
    contact: {
      name: "API Support",
      email: "support@todoapp.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === "production"
          ? "https://your-app-name.onrender.com/api"
          : "http://localhost:5000/api",
      description:
        process.env.NODE_ENV === "production"
          ? "Production server"
          : "Development server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        required: ["email", "password"],
        properties: {
          _id: {
            type: "string",
            description: "Unique identifier for the user",
          },
          email: {
            type: "string",
            format: "email",
            description: "User email address",
          },
          password: {
            type: "string",
            format: "password",
            description: "User password (hashed)",
            minLength: 6,
          },
          name: {
            type: "string",
            description: "User full name",
            maxLength: 50,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Date when user was created",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Date when user was last updated",
          },
        },
      },
      Task: {
        type: "object",
        required: ["title"],
        properties: {
          _id: {
            type: "string",
            description: "Unique identifier for the task",
          },
          user_id: {
            type: "string",
            description: "ID of the user who owns the task",
          },
          title: {
            type: "string",
            description: "Task title",
            maxLength: 100,
          },
          description: {
            type: "string",
            description: "Task description",
            maxLength: 500,
          },
          is_completed: {
            type: "boolean",
            description: "Task completion status",
            default: false,
          },
          priority: {
            type: "string",
            enum: ["Low", "Medium", "High"],
            description: "Task priority level",
            default: "Low",
          },
          due_date: {
            type: "string",
            format: "date-time",
            description: "Task due date",
          },
          subtasks: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Subtask",
            },
            description: "List of subtasks",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Task tags",
          },
          archived: {
            type: "boolean",
            description: "Whether the task is archived",
            default: false,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Date when task was created",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Date when task was last updated",
          },
        },
      },
      Subtask: {
        type: "object",
        required: ["title"],
        properties: {
          _id: {
            type: "string",
            description: "Unique identifier for the subtask",
          },
          title: {
            type: "string",
            description: "Subtask title",
            maxLength: 100,
          },
          is_completed: {
            type: "boolean",
            description: "Subtask completion status",
            default: false,
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Indicates if the request was successful",
          },
          message: {
            type: "string",
            description: "Response message",
          },
          data: {
            type: "object",
            properties: {
              user: {
                $ref: "#/components/schemas/User",
              },
              token: {
                type: "string",
                description: "JWT token for authentication",
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Indicates if the request was successful",
          },
          message: {
            type: "string",
            description: "Error message",
          },
          errors: {
            type: "array",
            items: {
              type: "object",
            },
            description: "Validation errors (if any)",
          },
          error: {
            type: "string",
            description: "Detailed error message (in development mode)",
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Access token is missing or invalid",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              message: "Access denied. No token provided.",
            },
          },
        },
      },
      ValidationError: {
        description: "Validation failed",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              message: "Validation failed",
              errors: [
                {
                  msg: "Title is required",
                  param: "title",
                  location: "body",
                },
              ],
            },
          },
        },
      },
      NotFoundError: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              message: "Task not found",
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Authentication",
      description: "User registration and login endpoints",
    },
    {
      name: "Tasks",
      description: "Task management endpoints",
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ["./routes/*.js", "./controllers/*.js", "./models/*.js"],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Swagger UI options
const swaggerUiOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Todo API Documentation",
  customfavIcon: "/assets/favicon.ico",
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions,
};
