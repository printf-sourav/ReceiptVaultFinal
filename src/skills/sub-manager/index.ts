import { supabase } from "../../services/supabaseWriter";
import { sendNotification } from "../../services/notificationSender";
import { getUserPrefs } from "../../utils/memory";
import { isWithinQuietHours, canSendAlert } from "../../utils/alertHelpers";
import { log, logError } from "../../utils/logger";

export async function runSubscriptionManager(): Promise<void> {
  log("Running Subscription Manager skill...");

  try {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    const { data: subs, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .gte("renewal_date", today)
      .lte("renewal_date", sevenDaysFromNow);

    if (error) {
      logError("Subscription Manager query failed", error);
      return;
    }

    if (!subs || subs.length === 0) {
      log("Subscription Manager: no upcoming renewals");
      return;
    }

    for (const sub of subs) {
      const prefs = await getUserPrefs(sub.user_phone);
      if (isWithinQuietHours(prefs)) continue;
      if (!canSendAlert(sub.user_phone, prefs.max_alerts_per_hour)) continue;

      const message = `${sub.service_name} renews on ${sub.renewal_date} for ${sub.currency} ${sub.renewal_amount}.\nReply KEEP to continue or CANCEL to record cancellation intent.`;
      await sendNotification(sub.user_phone, message);
      log(`Subscription alert sent: ${sub.service_name} → ${sub.user_phone}`);
    }
  } catch (error) {
    logError("Subscription Manager failed", error);
  }
}
