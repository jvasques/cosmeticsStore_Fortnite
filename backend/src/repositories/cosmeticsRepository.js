import pool from "../db/pool.js";

function normalizeListFilter(value) {
  if (!value) {
    return [];
  }
  const list = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(list.map((entry) => String(entry ?? "").trim().toLowerCase()).filter(Boolean))];
}

function parseDateFilter(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value.trim());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return null;
}

function buildCosmeticsFilters(filters = {}) {
  const conditions = [];
  const params = [];
  const introducedDateExpr = `COALESCE(
    DATE(c.added_at),
    DATE(c.new_since),
    CASE
      WHEN c.added_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN c.added_date::date
      ELSE NULL
    END
  )`;

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    params.push(`%${search}%`);
    const placeholder = params.length;
    conditions.push(
      `(LOWER(c.name) LIKE $${placeholder} OR LOWER(COALESCE(c.description, '')) LIKE $${placeholder})`
    );
  }

  const rarityList = normalizeListFilter(filters.rarity);
  if (rarityList.length) {
    params.push(rarityList);
    conditions.push(`LOWER(c.rarity_value) = ANY($${params.length})`);
  }

  const typeList = normalizeListFilter(filters.type);
  if (typeList.length) {
    params.push(typeList);
    conditions.push(`LOWER(c.type_value) = ANY($${params.length})`);
  }

  const introducedStart = parseDateFilter(filters.introducedStart ?? filters.introduced_start);
  if (introducedStart) {
    params.push(introducedStart);
    conditions.push(`${introducedDateExpr} >= $${params.length}`);
  }

  const introducedEnd = parseDateFilter(filters.introducedEnd ?? filters.introduced_end);
  if (introducedEnd) {
    params.push(introducedEnd);
    conditions.push(`${introducedDateExpr} <= $${params.length}`);
  }

  if (filters.onlyNew === true) {
    conditions.push("c.is_new = true");
  }

  if (filters.onlyAvailable === true) {
    conditions.push(
      `EXISTS (
        SELECT 1
        FROM shop_entry_items sei
        JOIN shop_entries se ON se.offer_id = sei.offer_id
        WHERE sei.cosmetic_id = c.id
          AND COALESCE(se.is_bundle, false) = false
      )`
    );
  }

  if (filters.onlyPromo === true) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM shop_entry_items sei
      JOIN shop_entries se ON se.offer_id = sei.offer_id
      WHERE sei.cosmetic_id = c.id
        AND COALESCE(se.is_bundle, false) = false
        AND se.final_price IS NOT NULL
        AND se.regular_price IS NOT NULL
        AND se.final_price < se.regular_price
    )`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, params };
}

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

export async function getCosmetics({ limit = 100, offset = 0, filters = {} } = {}) {
  const { whereClause, params } = buildCosmeticsFilters(filters);
  const query = `
    SELECT *
    FROM cosmetics c
    ${whereClause}
    ORDER BY c.added_at DESC NULLS LAST, c.id
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const { rows } = await pool.query(query, [...params, limit, offset]);
  return rows;
}

export async function getCosmeticsCount(filters = {}) {
  const { whereClause, params } = buildCosmeticsFilters(filters);
  const query = `
    SELECT COUNT(1)::int AS count
    FROM cosmetics c
    ${whereClause}
  `;
  const { rows } = await pool.query(query, params);
  return rows[0]?.count ?? 0;
}

export async function getCosmeticsMeta(filters = {}) {
  const { whereClause, params } = buildCosmeticsFilters(filters);
  const query = `
    WITH filtered AS (
      SELECT *
      FROM cosmetics c
      ${whereClause}
    ),
    filtered_rarities AS (
      SELECT json_agg(value ORDER BY value) AS values
      FROM (
        SELECT DISTINCT LOWER(TRIM(f.rarity_value)) AS value
        FROM filtered f
        WHERE f.rarity_value IS NOT NULL AND TRIM(f.rarity_value) <> ''
      ) r
    ),
    filtered_types AS (
      SELECT json_agg(value ORDER BY value) AS values
      FROM (
        SELECT DISTINCT LOWER(TRIM(f.type_value)) AS value
        FROM filtered f
        WHERE f.type_value IS NOT NULL AND TRIM(f.type_value) <> ''
      ) t
    ),
    global_rarities AS (
      SELECT json_agg(value ORDER BY value) AS values
      FROM (
        SELECT DISTINCT LOWER(TRIM(c.rarity_value)) AS value
        FROM cosmetics c
        WHERE c.rarity_value IS NOT NULL AND TRIM(c.rarity_value) <> ''
      ) gr
    ),
    global_types AS (
      SELECT json_agg(value ORDER BY value) AS values
      FROM (
        SELECT DISTINCT LOWER(TRIM(c.type_value)) AS value
        FROM cosmetics c
        WHERE c.type_value IS NOT NULL AND TRIM(c.type_value) <> ''
      ) gt
    )
    SELECT
      (SELECT COUNT(*)::int FROM filtered) AS total,
      COALESCE((SELECT values FROM filtered_rarities), '[]'::json) AS rarity_values,
      COALESCE((SELECT values FROM filtered_types), '[]'::json) AS type_values,
      COALESCE((SELECT values FROM global_rarities), '[]'::json) AS all_rarity_values,
      COALESCE((SELECT values FROM global_types), '[]'::json) AS all_type_values;
  `;

  const { rows } = await pool.query(query, params);
  const meta = rows[0] || {};
  return {
    total: meta.total ?? 0,
    rarities: Array.isArray(meta.rarity_values) ? meta.rarity_values : [],
    types: Array.isArray(meta.type_values) ? meta.type_values : [],
    allRarities: Array.isArray(meta.all_rarity_values) ? meta.all_rarity_values : [],
    allTypes: Array.isArray(meta.all_type_values) ? meta.all_type_values : [],
  };
}

export async function getNewCosmetics({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM cosmetics
     WHERE is_new = true
     ORDER BY new_since DESC NULLS LAST, added_at DESC NULLS LAST, id
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export async function getNewCosmeticsCount() {
  const { rows } = await pool.query(
    "SELECT COUNT(1)::int AS count FROM cosmetics WHERE is_new = true"
  );
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