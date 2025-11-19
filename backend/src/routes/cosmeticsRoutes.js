import { Router } from "express";
import {
	triggerSync,
	listCosmetics,
	listNewCosmetics,
} from "../controllers/cosmeticsController.js";

const router = Router();

router.post("/sync", triggerSync);
router.get("/", listCosmetics);
router.get("/new", listNewCosmetics);

export default router;