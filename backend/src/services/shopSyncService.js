import { fetchFortniteShopEntries } from "./fortniteService.js";
import { replaceShopEntries } from "../repositories/shopRepository.js";

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapShopEntry(entry) {
  if (!entry?.offerId) {
    return null;
  }

  const brItems = Array.isArray(entry.brItems) ? entry.brItems : [];

  return {
    offer_id: entry.offerId,
    regular_price: entry.regularPrice ?? null,
    final_price: entry.finalPrice ?? null,
    in_date: parseDate(entry.inDate),
    out_date: parseDate(entry.outDate),
    is_bundle: Boolean(entry.bundle),
    bundle_name: entry.bundle?.name ?? null,
    bundle_image: entry.bundle?.image ?? null,
    item_ids: brItems.map((item) => item?.id).filter(Boolean),
  };
}

export async function syncShopEntries() {
  const entries = await fetchFortniteShopEntries();
  const mapped = entries.map(mapShopEntry).filter(Boolean);
  await replaceShopEntries(mapped);
  return {
    fetched: entries.length,
    persisted: mapped.length,
  };
}