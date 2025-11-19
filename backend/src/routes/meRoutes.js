import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getProfile,
  updateProfile,
  getWalletSummary,
  listUserInventory,
  purchaseShopOffer,
  sellInventoryItem,
  refreshProfile,
} from "../controllers/meController.js";

const router = Router();

router.use(authenticate);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.get("/refresh", refreshProfile);
router.get("/wallet", getWalletSummary);
router.get("/inventory", listUserInventory);
router.post("/shop/purchase", purchaseShopOffer);
router.post("/inventory/sell", sellInventoryItem);

export default router;