import { randomUUID } from "crypto";
import pool from "../db/pool.js";

function getExecutor(client) {
  return client ?? pool;
}

export async function ensureWallet(userId, client) {
  const executor = getExecutor(client);
  await executor.query(
    `INSERT INTO user_wallets (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

export async function getWallet(userId, { forUpdate = false, client } = {}) {
  const executor = getExecutor(client);
  const locking = forUpdate ? "FOR UPDATE" : "";
  const { rows } = await executor.query(
    `SELECT user_id, balance, updated_at
     FROM user_wallets
     WHERE user_id = $1
     ${locking}`,
    [userId]
  );
  return rows[0] || null;
}

export async function updateWalletBalance(userId, delta, client) {
  const executor = getExecutor(client);
  const { rows } = await executor.query(
    `UPDATE user_wallets
     SET balance = balance + $2,
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING user_id, balance, updated_at`,
    [userId, delta]
  );
  return rows[0] || null;
}

export async function createWalletTransaction({ userId, amount, type, description, metadata }, client) {
  const executor = getExecutor(client);
  const id = randomUUID();
  const { rows } = await executor.query(
    `INSERT INTO wallet_transactions (id, user_id, amount, type, description, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, amount, type, description, metadata, created_at`,
    [id, userId, amount, type, description ?? null, metadata ?? null]
  );
  return rows[0];
}

export async function listWalletTransactions(userId, { limit = 20, offset = 0, client } = {}) {
  const executor = getExecutor(client);
  const { rows } = await executor.query(
    `SELECT id, amount, type, description, metadata, created_at
     FROM wallet_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
}