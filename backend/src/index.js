import app from "./app.js";
import env from "./config/env.js";
import pool from "./db/pool.js";
import { runMigrations } from "./db/migrations.js";
import { startSyncScheduler, stopSyncScheduler } from "./jobs/syncScheduler.js";
import { runFullSync } from "./services/fullSyncService.js";

let server;

async function start() {
  try {
    await runMigrations();
    console.log("[startup] Migrações aplicadas, iniciando sincronização inicial...");
    const { cosmeticsResult, newResult, shopResult } = await runFullSync();
    console.log(
      `[startup] Sincronização inicial concluída (catálogo ${cosmeticsResult.inserted}, novos ${newResult.flagged}, loja ${shopResult.persisted})`
    );
    server = app.listen(env.port, () => {
      console.log(`Servidor iniciado na porta ${env.port}`);
    });
    startSyncScheduler();
  } catch (error) {
    console.error("Erro ao iniciar servidor", error);
    await pool.end();
    process.exit(1);
  }
}

start();

const shutdown = async () => {
  console.log("Encerrando aplicação...");
  if (server) {
    server.close();
  }
  stopSyncScheduler();
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);