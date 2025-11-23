import { syncCosmetics } from "./cosmeticsSyncService.js";
import { syncNewCosmetics } from "./newCosmeticsService.js";
import { syncShopEntries } from "./shopSyncService.js";

export async function runFullSync() {
  const cosmeticsResult = await syncCosmetics();
  const newResult = await syncNewCosmetics();
  const shopResult = await syncShopEntries();

  return { cosmeticsResult, newResult, shopResult };
}
