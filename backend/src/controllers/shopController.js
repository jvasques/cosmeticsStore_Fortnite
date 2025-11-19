import { getShopEntries, getShopEntriesCount } from "../repositories/shopRepository.js";

export async function listShopEntries(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const [entries, total] = await Promise.all([
      getShopEntries({ limit, offset }),
      getShopEntriesCount(),
    ]);

    res.status(200).json({
      total,
      items: entries,
    });
  } catch (error) {
    next(error);
  }
}