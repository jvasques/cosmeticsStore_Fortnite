import { fetchFortniteCosmetics } from "./fortniteService.js";
import { upsertCosmetics } from "../repositories/cosmeticsRepository.js";
import { formatDateToBrazilian } from "../utils/date.js";

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "string" && value.trim().toLowerCase() === "null") {
    return null;
  }
  return value;
}

function mapCosmetic(item) {
  if (!item?.id) {
    return null;
  }

  const images = item.images ?? {};
  const addedAt = item.added ? new Date(item.added) : null;
  const addedAtValue = addedAt && !Number.isNaN(addedAt.getTime()) ? addedAt : null;
  return {
    id: item.id,
    name: normalizeText(item.name),
    description: normalizeText(item.description),
    type_value: item.type?.value ?? null,
    rarity_value: item.rarity?.value ?? null,
    image_small_icon: images.smallIcon ?? null,
    image_icon: images.icon ?? null,
    added_date: formatDateToBrazilian(item.added),
    added_at: addedAtValue,
  };
}

export async function syncCosmetics() {
  const cosmetics = await fetchFortniteCosmetics();
  const normalized = cosmetics
    .map(mapCosmetic)
    .filter((item) => Boolean(item));

  return upsertCosmetics(normalized);
}
