import { formatDateToBrazilian } from "./date.js";

const NULL_LIKE_VALUES = new Set(["null", "undefined", ""]);

export function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string" && NULL_LIKE_VALUES.has(value.trim().toLowerCase())) {
    return null;
  }

  return value;
}

export function mapApiCosmetic(item) {
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