import { fetchFortniteCosmetics } from "./fortniteService.js";
import { upsertCosmetics } from "../repositories/cosmeticsRepository.js";
import { mapApiCosmetic } from "../utils/cosmeticMapper.js";

export async function syncCosmetics() {
  const cosmetics = await fetchFortniteCosmetics();
  const normalized = cosmetics
    .map(mapApiCosmetic)
    .filter((item) => Boolean(item));

  return upsertCosmetics(normalized);
}