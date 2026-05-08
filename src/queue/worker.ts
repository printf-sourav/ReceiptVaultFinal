import { Worker, Job } from "bullmq";
import { log, logError } from "../utils/logger";
import { sendNotification } from "../services/notificationSender";
import { supabase } from "../services/supabaseWriter";
import { AlertJob } from "./producer";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function formatAlertMessage(job: AlertJob, storeName: string, date: string): string {
  switch (job.alertType) {
    case "return_deadline":
      return `Return window for your ${storeName} purchase closes tomorrow (${date}).`;
    case "warranty_expiry":
      return `Your warranty for ${storeName} expires in ${job.payload.daysRemaining} days (${date}).`;
    case "reorder":
      return `Time to reorder from ${storeName}!`;
    default:
      return `Alert for ${storeName}: ${job.alertType}`;
  }
}

async function processAlert(job: Job<AlertJob>): Promise<void> {
  const { receiptId, userPhone, alertType, payload } = job.data;

  try {
    const { data: receipt } = await supabase
      .from("receipts")
      .select("store_name, return_deadline_date, warranty_expiry_date")
      .eq("id", receiptId)
      .single();

    const storeName = receipt?.store_name || (payload.store_name as string) || "Unknown";
    const date = alertType === "return_deadline"
      ? receipt?.return_deadline_date || ""
      : receipt?.warranty_expiry_date || "";

    const message = formatAlertMessage(job.data, storeName, date);
    await sendNotification(userPhone, message);
    log(`Alert fired: ${alertType} for receipt ${receiptId}`);
  } catch (error) {
    logError(`Failed to process alert job for receipt ${receiptId}`, error);
    throw error;
  }
}

export function startWorker(): Worker<AlertJob> {
  const worker = new Worker<AlertJob>("receipt-alerts", processAlert, {
    connection: { url: REDIS_URL },
  });

  worker.on("completed", (job) => {
    log(`Job ${job.id} completed: ${job.data.alertType}`);
  });

  worker.on("failed", (job, err) => {
    logError(`Job ${job?.id} failed: ${err.message}`);
  });

  log("BullMQ worker started for queue: receipt-alerts");
  return worker;
}
