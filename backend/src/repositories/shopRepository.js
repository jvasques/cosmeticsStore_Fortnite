import pool from "../db/pool.js";

const INSERT_ENTRY = `
INSERT INTO shop_entries (
  offer_id,
  regular_price,
  final_price,
  in_date,
  out_date,
  is_bundle,
  bundle_name,
  bundle_image
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8);
`;

const INSERT_ENTRY_ITEM = `
INSERT INTO shop_entry_items (
  offer_id,
  cosmetic_id
) VALUES ($1,$2)
ON CONFLICT (offer_id, cosmetic_id) DO NOTHING;
`;

export async function replaceShopEntries(entries) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM shop_entry_items");
    await client.query("DELETE FROM shop_entries");

    for (const entry of entries) {
      await client.query(INSERT_ENTRY, [
        entry.offer_id,
        entry.regular_price,
        entry.final_price,
        entry.in_date,
        entry.out_date,
        entry.is_bundle,
        entry.bundle_name,
        entry.bundle_image,
      ]);

      for (const cosmeticId of entry.item_ids ?? []) {
        await client.query(INSERT_ENTRY_ITEM, [entry.offer_id, cosmeticId]);
      }
    }

    await client.query("COMMIT");
    return { entries: entries.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getShopEntries({ limit = 100, offset = 0 } = {}) {
  const query = `
    WITH aggregated AS (
      SELECT
        se.offer_id,
        se.regular_price,
        se.final_price,
        se.in_date,
        se.out_date,
        se.is_bundle,
        se.bundle_name,
        se.bundle_image,
        COALESCE(json_agg(
          json_build_object(
            'id', sei.cosmetic_id,
            'name', c.name,
            'description', c.description,
            'type_value', c.type_value,
            'rarity_value', c.rarity_value,
            'image_small_icon', c.image_small_icon,
            'image_icon', c.image_icon,
            'is_new', c.is_new,
            'new_since', c.new_since
          )
          ORDER BY c.added_at DESC NULLS LAST
        ) FILTER (WHERE sei.cosmetic_id IS NOT NULL), '[]'::json) AS items
      FROM shop_entries se
      LEFT JOIN shop_entry_items sei ON sei.offer_id = se.offer_id
      LEFT JOIN cosmetics c ON c.id = sei.cosmetic_id
      GROUP BY se.offer_id
    )
    SELECT *
    FROM aggregated
    ORDER BY in_date DESC NULLS LAST, offer_id
    LIMIT $1 OFFSET $2;
  `;

  const { rows } = await pool.query(query, [limit, offset]);
  return rows.map((row) => ({
    ...row,
    items: Array.isArray(row.items) ? row.items : JSON.parse(row.items ?? "[]"),
  }));
}

export async function getShopEntriesCount() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM shop_entries");
  return rows[0]?.count ?? 0;
}