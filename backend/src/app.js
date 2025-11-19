import express from "express";
import cosmeticsRoutes from "./routes/cosmeticsRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/cosmetics", cosmeticsRoutes);
app.use(errorHandler);

export default app;