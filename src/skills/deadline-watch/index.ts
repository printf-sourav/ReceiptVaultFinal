import { supabase } from "../../services/supabaseWriter";
import { sendNotification } from "../../services/notificationSender";
import { getUserPrefs } from "../../utils/memory";
import { isWithinQuietHours, canSendAlert } from "../../utils/alertHelpers";
import { log, logError } from "../../utils/logger";

export async function runDeadlineWatch(): Promise<void> {
  log("Running Deadline Watch skill...");

  try {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    const { data: receipts, error } = await supabase
      .from("receipts")
      .select("id, user_phone, store_name, return_deadline_date")
      .not("return_deadline_date", "is", null)
      .gte("return_deadline_date", today)
      .lte("return_deadline_date", sevenDaysFromNow);

    if (error) {
      logError("Deadline Watch query failed", error);
      return;
    }

    if (!receipts || receipts.length === 0) {
      log("Deadline Watch: no upcoming deadlines");
      return;
    }

    if (receipts && receipts.length > 0) {
      for (const receipt of receipts) {
        const deadlineDate = new Date(receipt.return_deadline_date);
        const todayDate = new Date(today);
        const daysRemaining = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / 86400000);

        if (daysRemaining !== 1 && daysRemaining !== 3 && daysRemaining !== 7) continue;

        const prefs = await getUserPrefs(receipt.user_phone);
        if (isWithinQuietHours(prefs)) continue;
        if (!canSendAlert(receipt.user_phone, prefs.max_alerts_per_hour)) continue;

        const message = `Return window for your ${receipt.store_name} purchase closes in ${daysRemaining} day(s) — ${receipt.return_deadline_date}. Act now if you want to return it.`;
        await sendNotification(receipt.user_phone, message);
        log(`Deadline alert sent: ${receipt.store_name} → ${receipt.user_phone} (${daysRemaining} days)`);
      }
    }

    // 2. Check Warranty Expiries
    const { data: warrantyReceipts, error: warrantyErr } = await supabase
      .from("receipts")
      .select("id, user_phone, store_name, warranty_expiry_date")
      .not("warranty_expiry_date", "is", null)
      .gte("warranty_expiry_date", today)
      .lte("warranty_expiry_date", sevenDaysFromNow);

    if (warrantyErr) {
      logError("Deadline Watch (warranties) query failed", warrantyErr);
    } else if (warrantyReceipts && warrantyReceipts.length > 0) {
      for (const receipt of warrantyReceipts) {
        const deadlineDate = new Date(receipt.warranty_expiry_date);
        const todayDate = new Date(today);
        const daysRemaining = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / 86400000);

        if (daysRemaining !== 1 && daysRemaining !== 3 && daysRemaining !== 7) continue;

        const prefs = await getUserPrefs(receipt.user_phone);
        if (isWithinQuietHours(prefs)) continue;
        if (!canSendAlert(receipt.user_phone, prefs.max_alerts_per_hour)) continue;

        const message = `Warranty for your ${receipt.store_name} purchase expires in ${daysRemaining} day(s) — ${receipt.warranty_expiry_date}.`;
        await sendNotification(receipt.user_phone, message);
        log(`Warranty alert sent: ${receipt.store_name} → ${receipt.user_phone} (${daysRemaining} days)`);
      }
    }
  } catch (error) {
    logError("Deadline Watch failed", error);
  }
}
