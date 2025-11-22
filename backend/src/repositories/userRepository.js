import { randomUUID } from "crypto";
import pool from "../db/pool.js";

function getExecutor(client) {
  return client ?? pool;
}

export async function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  const { rows } = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

export async function createUser({ email, passwordHash, displayName }, client) {
  const id = randomUUID();
  const insertQuery = `
    INSERT INTO users (id, email, password_hash, display_name)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const executor = getExecutor(client);
  const { rows } = await executor.query(insertQuery, [id, email, passwordHash, displayName]);
  return rows[0];
}

export async function getUserById(id, client) {
  const executor = getExecutor(client);
  const { rows } = await executor.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function updateDisplayName(userId, displayName, client) {
  const executor = getExecutor(client);
  const { rows } = await executor.query(
    `UPDATE users
     SET display_name = $2
     WHERE id = $1
     RETURNING *`,
    [userId, displayName]
  );
  return rows[0] || null;
}

export async function listUsers({ limit = 50, offset = 0 } = {}) {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const safeOffset = Math.max(0, offset);
  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.display_name,
       u.created_at,
       COALESCE(w.balance, 0) AS balance
     FROM users u
     LEFT JOIN user_wallets w ON w.user_id = u.id
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    [safeLimit, safeOffset]
  );
  return rows;
}