import pool from "../db/pool.js";

function getExecutor(client) {
  return client ?? pool;
}

export async function listInventory(userId, { limit = 50, offset = 0, client } = {}) {
  const executor = getExecutor(client);
  const { rows } = await executor.query(
    `SELECT
       ii.cosmetic_id,
       ii.quantity,
       ii.acquired_at,
       c.name,
       c.description,
       c.type_value,
       c.rarity_value,
       c.image_small_icon,
       c.image_icon
     FROM inventory_items ii
     JOIN cosmetics c ON c.id = ii.cosmetic_id
     WHERE ii.user_id = $1
     ORDER BY ii.acquired_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
}

export async function getInventoryItem(userId, cosmeticId, { forUpdate = false, client } = {}) {
  const executor = getExecutor(client);
  const locking = forUpdate ? "FOR UPDATE" : "";
  const { rows } = await executor.query(
    `SELECT user_id, cosmetic_id, quantity, acquired_at
     FROM inventory_items
     WHERE user_id = $1 AND cosmetic_id = $2
     ${locking}`,
    [userId, cosmeticId]
  );
  return rows[0] || null;
}

export async function incrementInventory({ userId, cosmeticId, quantity = 1 }, client) {
  const executor = getExecutor(client);
  await executor.query(
    `INSERT INTO inventory_items (user_id, cosmetic_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, cosmetic_id)
     DO UPDATE SET
       quantity = inventory_items.quantity + EXCLUDED.quantity,
       acquired_at = NOW()`,
    [userId, cosmeticId, quantity]
  );
}

export async function decrementInventory({ userId, cosmeticId, quantity = 1 }, client) {
  const executor = getExecutor(client);
  const { rows } = await executor.query(
    `UPDATE inventory_items
     SET quantity = quantity - $3
     WHERE user_id = $1 AND cosmetic_id = $2 AND quantity >= $3
     RETURNING quantity`,
    [userId, cosmeticId, quantity]
  );

  if (!rows[0]) {
    const error = new Error("Item insuficiente no inventário");
    error.status = 400;
    throw error;
  }

  if (rows[0].quantity <= 0) {
    await executor.query(
      "DELETE FROM inventory_items WHERE user_id = $1 AND cosmetic_id = $2",
      [userId, cosmeticId]
    );
  }
}