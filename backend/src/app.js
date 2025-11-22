import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import env from "./config/env.js";
import cosmeticsRoutes from "./routes/cosmeticsRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const corsOptions = env.cors.allowedOrigins.includes("*")
  ? { origin: true }
  : {
      origin(origin, callback) {
        if (!origin || env.cors.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin not allowed"));
      },
    };

app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Vary", "Origin");
  next();
});
app.use(express.json());

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Retorna status serviço
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Serviço disponível
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (req, res) => {
  res.json(swaggerSpec);
});
app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/users", userRoutes);
app.use("/cosmetics", cosmeticsRoutes);
app.use("/shop", shopRoutes);
app.use(errorHandler);

export default app;