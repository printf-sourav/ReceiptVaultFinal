import "dotenv/config";
import express from "express";
import cors from "cors";
import webhookRouter from "./routes/webhook";
import { startWorker } from "./queue/worker";
import { runSmokeTest } from "./queue/producer";
import { initScheduler } from "./scheduler";
import { log, logError } from "./utils/logger";

if (!process.env.REDIS_URL) {
  logError("REDIS_URL is not defined — BullMQ will not connect");
}

const app = express();
const PORT = process.env.PORT || 3000;
const publicBaseUrl = process.env.WEBHOOK_PUBLIC_URL?.replace(/\/$/, "");
const webhookCallbackUrl = publicBaseUrl ? `${publicBaseUrl}/webhook/whatsapp` : null;

// Lazy-load api router to avoid issues at startup
const apiRouter = require("./routes/api").default;

app.use(cors());
app.use(express.json());
app.get("/", (_req, res) => {
  res.send("ReceiptVault is running.");
});
app.use("/webhook", webhookRouter);
app.use("/api", apiRouter);

// Start the BullMQ worker (processes delayed alert jobs from Redis queue)
startWorker();

// Register all 5 autonomous cron jobs (8:00–8:20 AM daily)
initScheduler();

app.listen(PORT, () => {
  log(`ReceiptVault server running on port ${PORT}`);
  if (webhookCallbackUrl) {
    log(`Webhook callback URL: ${webhookCallbackUrl}`);
  } else {
    log("Set WEBHOOK_PUBLIC_URL to your tunnel URL so Meta can reach /webhook/whatsapp");
  }
  if (process.env.NODE_ENV !== "production") {
    runSmokeTest().catch((e) => logError("Smoke test failed to queue", e));
  }
});
