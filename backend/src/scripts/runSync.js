import env from "../config/env.js";
import { runFullSync } from "../services/fullSyncService.js";
import pool from "../db/pool.js";

(async () => {
  try {
    const { cosmeticsResult, newResult, shopResult } = await runFullSync();
    console.log(
      `Processados ${cosmeticsResult.inserted} itens a partir da API ${env.fortniteApiUrl}`
    );
    console.log(
      `Novos cosméticos: ${newResult.flagged} marcados (fetched ${newResult.fetched}) via ${env.fortniteApiNewUrl}`
    );
    console.log(
      `Itens da loja: ${shopResult.persisted} persistidos (fetched ${shopResult.fetched}) via ${env.fortniteShopUrl}`
    );
  } catch (error) {
    console.error("Falha ao sincronizar cosméticos", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();