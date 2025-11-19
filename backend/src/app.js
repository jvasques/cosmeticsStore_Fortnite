import express from "express";
import cosmeticsRoutes from "./routes/cosmeticsRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/cosmetics", cosmeticsRoutes);
app.use("/shop", shopRoutes);
app.use(errorHandler);

export default app;