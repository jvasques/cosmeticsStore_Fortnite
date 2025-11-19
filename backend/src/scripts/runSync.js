import env from "../config/env.js";
import { syncCosmetics } from "../services/cosmeticsSyncService.js";
import pool from "../db/pool.js";

(async () => {
  try {
    const result = await syncCosmetics();
    console.log(`Processados ${result.inserted} itens a partir da API ${env.fortniteApiUrl}`);
  } catch (error) {
    console.error("Falha ao sincronizar cosméticos", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
