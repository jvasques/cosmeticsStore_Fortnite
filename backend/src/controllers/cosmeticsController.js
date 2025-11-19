import { syncCosmetics } from "../services/cosmeticsSyncService.js";
import { getCosmetics, getCosmeticsCount } from "../repositories/cosmeticsRepository.js";

export async function triggerSync(req, res, next) {
  try {
    const result = await syncCosmetics();
    res.status(200).json({
      message: "Sincronização concluída",
      totalProcessado: result.inserted,
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
