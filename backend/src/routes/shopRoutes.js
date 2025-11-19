import { Router } from "express";
import { listShopEntries } from "../controllers/shopController.js";

const router = Router();

/**
 * @swagger
 * /shop/entries:
 *   get:
 *     summary: Lista entradas da loja atual
 *     tags: [Shop]
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
 *         name: bundle
 *         schema:
 *           type: boolean
 *         description: Filtra apenas bundles (true) ou itens individuais (false)
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *         description: "Lista separada por vírgula com raridades (ex.: epic,rare)"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: "Lista separada por vírgula com tipos (ex.: outfit,emote)"
 *       - in: query
 *         name: newOnly
 *         schema:
 *           type: boolean
 *         description: "Retorna apenas ofertas com cosméticos marcados como novos"
 *     responses:
 *       200:
 *         description: Lista de ofertas
 */
router.get("/entries", listShopEntries);

export default router;