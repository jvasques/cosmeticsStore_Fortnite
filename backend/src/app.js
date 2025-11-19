import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import cosmeticsRoutes from "./routes/cosmeticsRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

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
app.use("/cosmetics", cosmeticsRoutes);
app.use("/shop", shopRoutes);
app.use(errorHandler);

export default app;