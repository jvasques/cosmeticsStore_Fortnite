import { Router } from "express";
import {
	triggerSync,
	listCosmetics,
	listNewCosmetics,
} from "../controllers/cosmeticsController.js";

const router = Router();

/**
 * @swagger
 * /cosmetics/sync:
 *   post:
 *     summary: Dispara sincronização completa (catálogo, novos, loja)
 *     tags: [Cosmetics]
 *     security: []
 *     responses:
 *       200:
 *         description: Sincronização concluída
 */
router.post("/sync", triggerSync);

/**
 * @swagger
 * /cosmetics:
 *   get:
 *     summary: Lista cosméticos persistidos
 *     tags: [Cosmetics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de cosméticos
 */
router.get("/", listCosmetics);

/**
 * @swagger
 * /cosmetics/new:
 *   get:
 *     summary: Lista cosméticos marcados como novos
 *     tags: [Cosmetics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de cosméticos novos
 */
router.get("/new", listNewCosmetics);

export default router;