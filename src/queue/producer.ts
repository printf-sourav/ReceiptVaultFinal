import { Queue } from "bullmq";
import { log } from "../utils/logger";
import { ValidatedReceipt } from "../validators/receiptSchema";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export interface AlertJob {
  receiptId: string;
  userPhone: string;
  alertType: "return_deadline" | "warranty_expiry" | "reorder";
  scheduledFor: string;
  payload: Record<string, unknown>;
}

const alertQueue = new Queue("receipt-alerts", {
  connection: { url: REDIS_URL },
});

function addDaysToDate(dateStr: string, days: number): Date {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

export async function scheduleAlerts(
  receiptId: string,
  userPhone: string,
  data: ValidatedReceipt
): Promise<void> {
  const purchaseDate = data.purchase_date || new Date().toISOString().split("T")[0];
  const jobs: { jobData: AlertJob; delayMs: number }[] = [];

  if (data.return_deadline_days !== null) {
    const deadlineDate = addDaysToDate(purchaseDate, data.return_deadline_days);

    const sevenDayBefore = new Date(deadlineDate.getTime() - 7 * 86400000);
    const oneDayBefore = new Date(deadlineDate.getTime() - 1 * 86400000);

    const sevenDayDelay = sevenDayBefore.getTime() - Date.now();
    if (sevenDayDelay > 0) {
      jobs.push({
        jobData: {
          receiptId,
          userPhone,
          alertType: "return_deadline",
          scheduledFor: sevenDayBefore.toISOString(),
          payload: { daysRemaining: 7, store_name: data.store_name },
        },
        delayMs: sevenDayDelay,
      });
    }

    const oneDayDelay = oneDayBefore.getTime() - Date.now();
    if (oneDayDelay > 0) {
      jobs.push({
        jobData: {
          receiptId,
          userPhone,
          alertType: "return_deadline",
          scheduledFor: oneDayBefore.toISOString(),
          payload: { daysRemaining: 1, store_name: data.store_name },
        },
        delayMs: oneDayDelay,
      });
    }
  }

  if (data.warranty_months !== null) {
    const warrantyDate = addDaysToDate(purchaseDate, data.warranty_months * 30);

    const thirtyDayBefore = new Date(warrantyDate.getTime() - 30 * 86400000);
    const sevenDayBefore = new Date(warrantyDate.getTime() - 7 * 86400000);

    const thirtyDayDelay = thirtyDayBefore.getTime() - Date.now();
    if (thirtyDayDelay > 0) {
      jobs.push({
        jobData: {
          receiptId,
          userPhone,
          alertType: "warranty_expiry",
          scheduledFor: thirtyDayBefore.toISOString(),
          payload: { daysRemaining: 30, store_name: data.store_name },
        },
        delayMs: thirtyDayDelay,
      });
    }

    const sevenDayDelay = sevenDayBefore.getTime() - Date.now();
    if (sevenDayDelay > 0) {
      jobs.push({
        jobData: {
          receiptId,
          userPhone,
          alertType: "warranty_expiry",
          scheduledFor: sevenDayBefore.toISOString(),
          payload: { daysRemaining: 7, store_name: data.store_name },
        },
        delayMs: sevenDayDelay,
      });
    }
  }

  for (const { jobData, delayMs } of jobs) {
    await alertQueue.add("alert", jobData, { delay: delayMs });
    log(`Scheduled ${jobData.alertType} alert for receipt ${receiptId} in ${Math.round(delayMs / 86400000)} days`);
  }
}

// SMOKE TEST
export async function runSmokeTest(): Promise<void> {
  const TEST_PHONE = process.env.TEST_PHONE || "0000000000";
  const smokeJob: AlertJob = {
    receiptId: "smoke-test-id",
    userPhone: TEST_PHONE,
    alertType: "return_deadline",
    scheduledFor: new Date(Date.now() + 10000).toISOString(),
    payload: { daysRemaining: 1, store_name: "Smoke Test Store" },
  };

  await alertQueue.add("alert", smokeJob, { delay: 10000 });
  log("Smoke test job queued — fires in 10 seconds");
}
