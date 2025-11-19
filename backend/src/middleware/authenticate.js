import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { getUserById } from "../repositories/userRepository.js";
import { sanitizeUser } from "../services/authService.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      const error = new Error("Credenciais obrigatórias");
      error.status = 401;
      throw error;
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch (verifyError) {
      const error = new Error("Token inválido ou expirado");
      error.status = 401;
      throw error;
    }

    const user = await getUserById(payload.sub);
    if (!user) {
      const error = new Error("Usuário não encontrado");
      error.status = 401;
      throw error;
    }

    req.user = sanitizeUser(user);
    req.tokenPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
}