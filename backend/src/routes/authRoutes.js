import { Router } from "express";
import { register, login } from "../controllers/authController.js";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Cria uma nova conta
 *     description: Cria uma nova conta e credita automaticamente 10.000 V-Bucks no saldo inicial do usuário.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado e saldo inicial creditado
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza login e retorna o token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Autenticado com sucesso
 */
router.post("/login", login);

export default router;