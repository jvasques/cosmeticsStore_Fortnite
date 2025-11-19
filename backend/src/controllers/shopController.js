import { getShopEntries, getShopEntriesCount } from "../repositories/shopRepository.js";

function parseBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  return undefined;
}

function parseList(value) {
  if (value === undefined) {
    return [];
  }

  const rawValues = Array.isArray(value) ? value : String(value).split(",");
  return rawValues
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.toLowerCase());
}

export async function listShopEntries(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const filters = {
      bundle: parseBoolean(req.query.bundle),
      rarity: parseList(req.query.rarity),
      type: parseList(req.query.type),
      onlyNew: parseBoolean(req.query.newOnly ?? req.query.onlyNew),
    };

    if (filters.onlyNew === false) {
      delete filters.onlyNew;
    }
    if (!filters.rarity?.length) {
      delete filters.rarity;
    }
    if (!filters.type?.length) {
      delete filters.type;
    }
    if (filters.bundle === undefined) {
      delete filters.bundle;
    }

    const [entries, total] = await Promise.all([
      getShopEntries({ limit, offset, filters }),
      getShopEntriesCount(filters),
    ]);

    res.status(200).json({
      total,
      items: entries,
    });
  } catch (error) {
    next(error);
  }
}