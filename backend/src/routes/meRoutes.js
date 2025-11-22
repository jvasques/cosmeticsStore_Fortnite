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

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Retorna o perfil autenticado
 *     tags: [Me]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Perfil atual
 */
router.get("/", getProfile);

/**
 * @swagger
 * /me:
 *   patch:
 *     summary: Atualiza o display name
 *     tags: [Me]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 */
router.patch("/", updateProfile);

/**
 * @swagger
 * /me/refresh:
 *   get:
 *     summary: Recarrega dados do usuário
 *     tags: [Me]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/refresh", refreshProfile);

/**
 * @swagger
 * /me/wallet:
 *   get:
 *     summary: Mostra saldo e transações
 *     tags: [Wallet]
 *     security: [{ bearerAuth: [] }]
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
 *         description: Saldo atual e últimas transações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: integer
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       amount:
 *                         type: integer
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 */
router.get("/wallet", getWalletSummary);

/**
 * @swagger
 * /me/inventory:
 *   get:
 *     summary: Lista itens do inventário
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 */
router.get("/inventory", listUserInventory);

/**
 * @swagger
 * /me/shop/purchase:
 *   post:
 *     summary: Compra uma oferta
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offerId]
 *             properties:
 *               offerId:
 *                 type: string
 */
router.post("/shop/purchase", purchaseShopOffer);

/**
 * @swagger
 * /me/inventory/sell:
 *   post:
 *     summary: Vende um item do inventário
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cosmeticId:
 *                 type: string
 *                 description: "Identificador único do item a ser vendido"
 *               cosmeticIds:
 *                 type: array
 *                 description: "Lista de cosmeticIds. Obrigatória ao vender bundles (deve conter todos os itens do pacote)."
 *                 items:
 *                   type: string
 */
router.post("/inventory/sell", sellInventoryItem);

export default router;