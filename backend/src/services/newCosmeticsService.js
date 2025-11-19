import { fetchFortniteNewCosmetics } from "./fortniteService.js";
import { upsertCosmetics, resetNewFlags, markCosmeticsAsNew } from "../repositories/cosmeticsRepository.js";
import { mapApiCosmetic } from "../utils/cosmeticMapper.js";

export async function syncNewCosmetics() {
  const newItems = await fetchFortniteNewCosmetics();
  const normalized = newItems.map(mapApiCosmetic).filter(Boolean);

  if (normalized.length) {
    await upsertCosmetics(normalized);
  }

  await resetNewFlags();
  const { updated } = await markCosmeticsAsNew(
    normalized.map((item) => ({
      id: item.id,
      new_since: item.added_at ?? new Date(),
    }))
  );

  return {
    fetched: newItems.length,
    flagged: updated,
  };
}