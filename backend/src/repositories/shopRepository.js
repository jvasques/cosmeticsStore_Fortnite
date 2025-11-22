import pool from "../db/pool.js";

function buildShopFilters(filters = {}) {
  const conditions = [];
  const params = [];

  if (typeof filters.bundle === "boolean") {
    params.push(filters.bundle);
    conditions.push(`se.is_bundle = $${params.length}`);
  }

  if (Array.isArray(filters.rarity) && filters.rarity.length) {
    params.push(filters.rarity);
    conditions.push(`EXISTS (
      SELECT 1
      FROM shop_entry_items sei
      JOIN cosmetics c ON c.id = sei.cosmetic_id
      WHERE sei.offer_id = se.offer_id
        AND LOWER(c.rarity_value) = ANY($${params.length})
    )`);
  }

  if (Array.isArray(filters.type) && filters.type.length) {
    params.push(filters.type);
    conditions.push(`EXISTS (
      SELECT 1
      FROM shop_entry_items sei
      JOIN cosmetics c ON c.id = sei.cosmetic_id
      WHERE sei.offer_id = se.offer_id
        AND LOWER(c.type_value) = ANY($${params.length})
    )`);
  }

  if (filters.onlyNew === true) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM shop_entry_items sei
      JOIN cosmetics c ON c.id = sei.cosmetic_id
      WHERE sei.offer_id = se.offer_id
        AND c.is_new = true
    )`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, params };
}

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

export async function getShopEntries({ limit = 100, offset = 0, filters = {} } = {}) {
  const { whereClause, params } = buildShopFilters(filters);
  const query = `
    WITH filtered AS (
      SELECT *
      FROM shop_entries se
      ${whereClause}
    ),
    aggregated AS (
      SELECT
        f.offer_id,
        f.regular_price,
        f.final_price,
        f.in_date,
        f.out_date,
        f.is_bundle,
        f.bundle_name,
        f.bundle_image,
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
      FROM filtered f
      LEFT JOIN shop_entry_items sei ON sei.offer_id = f.offer_id
      LEFT JOIN cosmetics c ON c.id = sei.cosmetic_id
      GROUP BY
        f.offer_id,
        f.regular_price,
        f.final_price,
        f.in_date,
        f.out_date,
        f.is_bundle,
        f.bundle_name,
        f.bundle_image
    )
    SELECT *
    FROM aggregated
    ORDER BY in_date DESC NULLS LAST, offer_id
    LIMIT $${params.length + 1} OFFSET $${params.length + 2};
  `;

  const { rows } = await pool.query(query, [...params, limit, offset]);
  return rows.map((row) => ({
    ...row,
    items: Array.isArray(row.items) ? row.items : JSON.parse(row.items ?? "[]"),
  }));
}

export async function getShopEntriesCount(filters = {}) {
  const { whereClause, params } = buildShopFilters(filters);
  const query = `
    SELECT COUNT(*)::int AS count
    FROM shop_entries se
    ${whereClause}
  `;
  const { rows } = await pool.query(query, params);
  return rows[0]?.count ?? 0;
}

export async function getShopEntryById(offerId, client) {
  const executor = client ?? pool;
  const query = `
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
          'image_icon', c.image_icon
        )
        ORDER BY c.added_at DESC NULLS LAST
      ) FILTER (WHERE sei.cosmetic_id IS NOT NULL), '[]'::json) AS items
    FROM shop_entries se
    LEFT JOIN shop_entry_items sei ON sei.offer_id = se.offer_id
    LEFT JOIN cosmetics c ON c.id = sei.cosmetic_id
    WHERE se.offer_id = $1
    GROUP BY se.offer_id;
  `;

  const { rows } = await executor.query(query, [offerId]);
  const entry = rows[0];
  if (!entry) {
    return null;
  }

  return {
    ...entry,
    items: Array.isArray(entry.items) ? entry.items : JSON.parse(entry.items ?? "[]"),
  };
}

export async function getLatestPriceForCosmetic(cosmeticId, client) {
  const executor = client ?? pool;
  const { rows } = await executor.query(
    `SELECT se.final_price, se.regular_price, se.is_bundle, se.offer_id
     FROM shop_entry_items sei
     JOIN shop_entries se ON se.offer_id = sei.offer_id
     WHERE sei.cosmetic_id = $1
     ORDER BY se.is_bundle ASC, se.in_date DESC NULLS LAST, se.offer_id
     LIMIT 1`,
    [cosmeticId]
  );
  return rows[0] || null;
}