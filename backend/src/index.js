import app from "./app.js";
import env from "./config/env.js";
import pool from "./db/pool.js";

const server = app.listen(env.port, () => {
  console.log(`Servidor iniciado na porta ${env.port}`);
});

const shutdown = async () => {
  console.log("Encerrando aplicação...");
  server.close();
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);