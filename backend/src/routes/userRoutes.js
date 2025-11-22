import { Router } from "express";
import { listPublicUsers, getPublicUserInventory } from "../controllers/userController.js";

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista usuários disponíveis publicamente
 *     tags: [Users]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Lista de usuários com nome público e saldo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       balance:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/", listPublicUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Mostra inventário público de um usuário
 *     tags: [Users]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Inventário do usuário informado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     balance:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         description: Usuário não encontrado
 */
router.get("/:id", getPublicUserInventory);

export default router;
