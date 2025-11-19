import pool from "../db/pool.js";

const UPSERT_COSMETIC = `
INSERT INTO cosmetics (
  id,
  name,
  description,
  type_value,
  rarity_value,
  image_small_icon,
  image_icon,
  added_date,
  added_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type_value = EXCLUDED.type_value,
  rarity_value = EXCLUDED.rarity_value,
  image_small_icon = EXCLUDED.image_small_icon,
  image_icon = EXCLUDED.image_icon,
  added_date = EXCLUDED.added_date,
  added_at = EXCLUDED.added_at;
`;

export async function upsertCosmetics(rows) {
  if (!rows?.length) {
    return { inserted: 0 };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const row of rows) {
      await client.query(UPSERT_COSMETIC, [
        row.id,
        row.name,
        row.description,
        row.type_value,
        row.rarity_value,
        row.image_small_icon,
        row.image_icon,
        row.added_date,
        row.added_at,
      ]);
    }

    await client.query("COMMIT");
    return { inserted: rows.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getCosmetics({ limit = 100, offset = 0 } = {}) {
  const { rows } = await pool.query(
    "SELECT * FROM cosmetics ORDER BY added_at DESC NULLS LAST, id LIMIT $1 OFFSET $2",
    [limit, offset]
  );
  return rows;
}

export async function getCosmeticsCount() {
  const { rows } = await pool.query("SELECT COUNT(1)::int AS count FROM cosmetics");
  return rows[0]?.count ?? 0;
}

export async function resetNewFlags() {
  await pool.query("UPDATE cosmetics SET is_new = false, new_since = NULL WHERE is_new = true");
}

export async function markCosmeticsAsNew(items) {
  if (!items?.length) {
    return { updated: 0 };
  }

  const client = await pool.connect();
  let updated = 0;

  try {
    await client.query("BEGIN");

    for (const item of items) {
      const result = await client.query(
        `UPDATE cosmetics
         SET is_new = true,
             new_since = COALESCE($2, added_at, new_since)
         WHERE id = $1`,
        [item.id, item.new_since]
      );
      updated += result.rowCount ?? 0;
    }

    await client.query("COMMIT");
    return { updated };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}