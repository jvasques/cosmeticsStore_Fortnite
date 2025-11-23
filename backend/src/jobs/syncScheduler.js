import cron from "node-cron";
import env from "../config/env.js";
import { runFullSync } from "../services/fullSyncService.js";

let task;
let running = false;

function log(message) {
  console.log(`[cron] ${message}`);
}

export function startSyncScheduler() {
  const schedule = env.syncCronSchedule;
  if (!schedule || schedule.toLowerCase() === "off" || schedule.toLowerCase() === "") {
    log("Sincronização automática desabilitada");
    return;
  }

  if (!cron.validate(schedule)) {
    console.error(`[cron] Cron inválido: "${schedule}". Job não será iniciado.`);
    return;
  }

  const timezone = env.syncCronTimezone || "Etc/UTC";

  task = cron.schedule(
    schedule,
    async () => {
      if (running) {
        log("Execução anterior ainda em andamento, ignorando novo disparo.");
        return;
      }

      running = true;
      log(`Job iniciado às ${new Date().toISOString()} (${timezone})`);

      try {
        const { cosmeticsResult, newResult, shopResult } = await runFullSync();
        log(
          `Concluído. Catálogo: ${cosmeticsResult.inserted}, Novos: ${newResult.flagged}, Loja: ${shopResult.persisted}`
        );
      } catch (error) {
        console.error("[cron] Falha durante sincronização agendada", error);
      } finally {
        running = false;
      }
    },
    {
      timezone,
    }
  );

  log(`Agendado com expressão "${schedule}" (timezone ${timezone}).`);
}

export function stopSyncScheduler() {
  if (task) {
    task.stop();
    task = undefined;
    log("Job parado.");
  }
}
