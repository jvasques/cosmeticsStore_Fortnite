import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import pool from "./pool.js";

const initSqlPath = path.resolve(fileURLToPath(new URL("../../db/init.sql", import.meta.url)));

function loadStatements() {
  const raw = fs.readFileSync(initSqlPath, "utf8");
  return raw
    .split(/;\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`);
}

export async function runMigrations() {
  const statements = loadStatements();
  for (const sql of statements) {
    await pool.query(sql);
  }
  console.log(`[db] Migrações aplicadas (${statements.length} statements)`);
}