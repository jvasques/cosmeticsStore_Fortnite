import app from "./app.js";
import env from "./config/env.js";
import pool from "./db/pool.js";
import { runMigrations } from "./db/migrations.js";

let server;

async function start() {
  try {
    await runMigrations();
    server = app.listen(env.port, () => {
      console.log(`Servidor iniciado na porta ${env.port}`);
    });
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
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);