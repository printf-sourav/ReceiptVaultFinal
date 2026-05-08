import "dotenv/config";
import { runDeadlineWatch } from "./skills/deadline-watch";
import { runConsumableTracker } from "./skills/consumable-tracker";
import { runSubscriptionManager } from "./skills/sub-manager";
import { runSpendingDashboard } from "./skills/spending-dashboard";
import { runPriceMonitor } from "./skills/price-monitor";
import { scanAllLinkedGmailAccounts } from "./services/gmailScanner";
import { startWorker } from "./queue/worker";
import { log } from "./utils/logger";
import cron from "node-cron";

export function initScheduler(): void {
  cron.schedule("0 8 * * *", runDeadlineWatch);
  cron.schedule("5 8 * * *", runConsumableTracker);
  cron.schedule("10 8 * * *", runSubscriptionManager);
  cron.schedule("15 8 * * 1", runSpendingDashboard);
  cron.schedule("20 8 * * *", scanAllLinkedGmailAccounts);
  cron.schedule("25 8 * * *", runPriceMonitor);

  // Run Gmail scan once on startup so new receipts are picked up immediately.
  scanAllLinkedGmailAccounts().catch((error) => {
    log("Initial Gmail scan failed", error);
  });

  log("ReceiptVault scheduler initialized. All 6 jobs registered.");
}

// When run directly as `npm run scheduler`, register jobs and start the worker.
// When imported by index.ts, only initScheduler() is called — index.ts owns the worker.
if (require.main === module) {
  startWorker();
  initScheduler();
  log("ReceiptVault scheduler running as standalone process.");
}
