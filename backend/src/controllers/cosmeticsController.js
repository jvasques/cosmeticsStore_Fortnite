import { syncCosmetics } from "../services/cosmeticsSyncService.js";
import { syncNewCosmetics } from "../services/newCosmeticsService.js";
import { syncShopEntries } from "../services/shopSyncService.js";
import {
  getCosmetics,
  getCosmeticsCount,
  getCosmeticsMeta,
  getNewCosmetics,
  getNewCosmeticsCount,
} from "../repositories/cosmeticsRepository.js";

function parseBoolean(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }
    return ["true", "1", "yes", "on"].includes(normalized);
  }
  return Boolean(value);
}

function extractFilterArray(value) {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.includes(",")) {
    return value.split(",");
  }
  return value;
}

export async function triggerSync(req, res, next) {
  try {
    const cosmeticsResult = await syncCosmetics();
    const newResult = await syncNewCosmetics();
    const shopResult = await syncShopEntries();
    res.status(200).json({
      message: "Sincronização concluída",
      totals: {
        cosmeticsUpserted: cosmeticsResult.inserted,
        newCosmeticsFetched: newResult.fetched,
        newCosmeticsFlagged: newResult.flagged,
        shopEntriesFetched: shopResult.fetched,
        shopEntriesPersisted: shopResult.persisted,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listCosmetics(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const offset = Number(req.query.offset) || 0;
    const filters = {
      search: req.query.search?.trim(),
      rarity: extractFilterArray(req.query.rarity),
      type: extractFilterArray(req.query.type),
      introducedStart: req.query.introducedStart ?? req.query.introduced_start,
      introducedEnd: req.query.introducedEnd ?? req.query.introduced_end,
      onlyNew: parseBoolean(req.query.onlyNew ?? req.query.only_new),
      onlyAvailable: parseBoolean(req.query.onlyAvailable ?? req.query.only_available),
      onlyPromo: parseBoolean(req.query.onlyPromo ?? req.query.only_promo),
    };
    const [rows, meta] = await Promise.all([
      getCosmetics({ limit, offset, filters }),
      getCosmeticsMeta(filters),
    ]);

    res.status(200).json({
      total: meta.total,
      items: rows,
      facets: {
        rarities: meta.rarities,
        types: meta.types,
        allRarities: meta.allRarities,
        allTypes: meta.allTypes,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listNewCosmetics(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const [rows, total] = await Promise.all([
      getNewCosmetics({ limit, offset }),
      getNewCosmeticsCount(),
    ]);

    res.status(200).json({
      total,
      items: rows,
    });
  } catch (error) {
    next(error);
  }
}