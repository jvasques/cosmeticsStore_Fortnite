import { Router } from "express";
import { triggerSync, listCosmetics } from "../controllers/cosmeticsController.js";

const router = Router();

router.post("/sync", triggerSync);
router.get("/", listCosmetics);

export default router;