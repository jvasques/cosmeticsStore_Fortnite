import pool from "../db/pool.js";

function getExecutor(client) {
  return client ?? pool;
}

export async function listInventory(userId, { limit = 50, offset = 0, client } = {}) {
  const executor = getExecutor(client);
  const { rows } = await executor.query(
    `SELECT
       ii.cosmetic_id,
       ii.offer_id,
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
    `SELECT ii.user_id, ii.cosmetic_id, ii.offer_id, ii.acquired_at, c.name AS cosmetic_name
     FROM inventory_items ii
     JOIN cosmetics c ON c.id = ii.cosmetic_id
     WHERE user_id = $1 AND cosmetic_id = $2
     ${locking}`,
    [userId, cosmeticId]
  );
  return rows[0] || null;
}

export async function getInventoryItems(userId, cosmeticIds, { forUpdate = false, client } = {}) {
  if (!cosmeticIds?.length) {
    return [];
  }
  const executor = getExecutor(client);
  const locking = forUpdate ? "FOR UPDATE" : "";
  const { rows } = await executor.query(
    `SELECT ii.user_id, ii.cosmetic_id, ii.offer_id, ii.acquired_at, c.name AS cosmetic_name
     FROM inventory_items ii
     JOIN cosmetics c ON c.id = ii.cosmetic_id
     WHERE ii.user_id = $1 AND ii.cosmetic_id = ANY($2::text[])
     ${locking}`,
    [userId, cosmeticIds]
  );
  return rows;
}

export async function incrementInventory({ userId, cosmeticId, offerId }, client) {
  const executor = getExecutor(client);
  await executor.query(
    `INSERT INTO inventory_items (user_id, cosmetic_id, offer_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, cosmetic_id)
     DO UPDATE SET
       offer_id = EXCLUDED.offer_id,
       acquired_at = NOW()`,
    [userId, cosmeticId, offerId ?? null]
  );
}

export async function listInventoryItemsByOffer(userId, offerId, { forUpdate = false, client } = {}) {
  if (!offerId) {
    return [];
  }
  const executor = getExecutor(client);
  const locking = forUpdate ? "FOR UPDATE" : "";
  const { rows } = await executor.query(
    `SELECT ii.user_id, ii.cosmetic_id, ii.offer_id, ii.acquired_at, c.name AS cosmetic_name
     FROM inventory_items ii
     JOIN cosmetics c ON c.id = ii.cosmetic_id
     WHERE user_id = $1 AND offer_id = $2
     ${locking}`,
    [userId, offerId]
  );
  return rows;
}

export async function removeInventoryItems(userId, cosmeticIds, client) {
  if (!cosmeticIds?.length) {
    return 0;
  }
  const executor = getExecutor(client);
  const { rowCount } = await executor.query(
    `DELETE FROM inventory_items
     WHERE user_id = $1 AND cosmetic_id = ANY($2::text[])`,
    [userId, cosmeticIds]
  );
  return rowCount;
}