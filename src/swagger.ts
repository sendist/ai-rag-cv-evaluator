// src/swagger.ts
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

export function setupSwagger(app: Express) {
  const options: swaggerJSDoc.Options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "AI Evaluator API",
        version: "1.0.0",
        description:
          "API documentation for the AI-based CV and project evaluator system.",
      },
      servers: [
        { url: "http://localhost:3000", description: "Local server" },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "x-api-key",
            description: "Enter your API key to access this endpoint.",
          },
        },
      },
      security: [{ ApiKeyAuth: [] }],
    },
    apis: ["./src/api/*.ts"],
  };

  const swaggerSpec = swaggerJSDoc(options);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger docs available at http://localhost:3000/docs");
}
