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