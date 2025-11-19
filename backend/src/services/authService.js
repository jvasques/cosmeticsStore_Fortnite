import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { createUser, findUserByEmail } from "../repositories/userRepository.js";

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    createdAt: user.created_at,
  };
}

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function assertCredentials({ email, password }) {
  if (!email || typeof email !== "string") {
    const error = new Error("E-mail é obrigatório");
    error.status = 400;
    throw error;
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    const error = new Error("Senha precisa ter pelo menos 6 caracteres");
    error.status = 400;
    throw error;
  }
}

export async function registerUser({ email, password, displayName }) {
  assertCredentials({ email, password });

  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error("E-mail já cadastrado");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const safeDisplayName = displayName?.trim() || email.split("@")[0];
  const user = await createUser({ email, passwordHash, displayName: safeDisplayName });
  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function loginUser({ email, password }) {
  assertCredentials({ email, password });

  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error("Credenciais inválidas");
    error.status = 401;
    throw error;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const error = new Error("Credenciais inválidas");
    error.status = 401;
    throw error;
  }

  const token = generateToken(user);
  return {
    user: sanitizeUser(user),
    token,
  };
}