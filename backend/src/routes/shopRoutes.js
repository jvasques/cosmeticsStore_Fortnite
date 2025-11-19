import { Router } from "express";
import { listShopEntries } from "../controllers/shopController.js";

const router = Router();

router.get("/entries", listShopEntries);

export default router;