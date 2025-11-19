import { syncCosmetics } from "../services/cosmeticsSyncService.js";
import { syncNewCosmetics } from "../services/newCosmeticsService.js";
import { syncShopEntries } from "../services/shopSyncService.js";
import { getCosmetics, getCosmeticsCount } from "../repositories/cosmeticsRepository.js";

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
    const [rows, total] = await Promise.all([
      getCosmetics({ limit, offset }),
      getCosmeticsCount(),
    ]);

    res.status(200).json({
      total,
      items: rows,
    });
  } catch (error) {
    next(error);
  }
}