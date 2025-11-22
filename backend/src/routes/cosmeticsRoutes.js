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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por nome ou descrição
 *       - in: query
 *         name: rarity
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filtra por uma ou mais raridades (ex. legendary)
 *       - in: query
 *         name: type
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filtra por tipo (outfit, glider...)
 *       - in: query
 *         name: introducedStart
 *         schema:
 *           type: string
 *           format: date
 *         description: Data mínima de introdução (YYYY-MM-DD)
 *       - in: query
 *         name: introducedEnd
 *         schema:
 *           type: string
 *           format: date
 *         description: Data máxima de introdução (YYYY-MM-DD)
 *       - in: query
 *         name: onlyNew
 *         schema:
 *           type: boolean
 *         description: Quando true, retorna apenas itens marcados como novos
 *       - in: query
 *         name: onlyAvailable
 *         schema:
 *           type: boolean
 *         description: Quando true, exige que o item esteja em alguma oferta ativa
 *       - in: query
 *         name: onlyPromo
 *         schema:
 *           type: boolean
 *         description: Quando true, exige que exista oferta com final_price < regular_price
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