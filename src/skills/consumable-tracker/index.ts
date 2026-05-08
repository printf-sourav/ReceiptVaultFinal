import { supabase } from "../../services/supabaseWriter";
import { sendNotification } from "../../services/notificationSender";
import { getUserPrefs, saveUserPatterns } from "../../utils/memory";
import { isWithinQuietHours, canSendAlert } from "../../utils/alertHelpers";
import { log, logError } from "../../utils/logger";

export async function runConsumableTracker(): Promise<void> {
  log("Running Consumable Tracker skill...");

  try {
    const { data: rows, error } = await supabase
      .from("receipt_items")
      .select("name, receipts!inner(user_phone, purchase_date)")
      .eq("is_consumable", true);

    if (error) {
      logError("Consumable Tracker query failed", error);
      return;
    }

    if (!rows || rows.length === 0) {
      log("Consumable Tracker: no consumable items found");
      return;
    }

    const userItemMap: Record<string, Record<string, Date[]>> = {};

    for (const row of rows) {
      const receipt = row.receipts as any;
      const userPhone: string = receipt.user_phone;
      const purchaseDate = new Date(receipt.purchase_date);
      const itemName: string = row.name.toLowerCase();

      if (!userItemMap[userPhone]) userItemMap[userPhone] = {};
      if (!userItemMap[userPhone][itemName]) userItemMap[userPhone][itemName] = [];
      userItemMap[userPhone][itemName].push(purchaseDate);
    }

    const today = new Date();

    for (const [userPhone, items] of Object.entries(userItemMap)) {
      const reorderIntervals: { item_name: string; avg_days: number; last_purchased: string }[] = [];

      for (const [itemName, dates] of Object.entries(items)) {
        if (dates.length < 2) continue;

        dates.sort((a, b) => a.getTime() - b.getTime());

        const gaps: number[] = [];
        for (let i = 1; i < dates.length; i++) {
          gaps.push((dates[i].getTime() - dates[i - 1].getTime()) / 86400000);
        }

        const avgDays = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
        const lastPurchased = dates[dates.length - 1];
        const predictedNext = new Date(lastPurchased.getTime() + avgDays * 86400000);

        reorderIntervals.push({
          item_name: itemName,
          avg_days: avgDays,
          last_purchased: lastPurchased.toISOString().split("T")[0],
        });

        const daysUntilReorder = Math.ceil((predictedNext.getTime() - today.getTime()) / 86400000);

        if (daysUntilReorder <= 3 && daysUntilReorder >= 0) {
          const prefs = await getUserPrefs(userPhone);
          if (isWithinQuietHours(prefs)) continue;
          if (!canSendAlert(userPhone, prefs.max_alerts_per_hour)) continue;

          const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(itemName)}`;
          const message = `Running low on ${itemName}? Your usual reorder is due around ${predictedNext.toISOString().split("T")[0]}. Order here: ${searchUrl}`;
          await sendNotification(userPhone, message);
          log(`Reorder alert sent: ${itemName} → ${userPhone}`);
        }
      }

      await saveUserPatterns(userPhone, { reorder_intervals: reorderIntervals });
    }
  } catch (error) {
    logError("Consumable Tracker failed", error);
  }
}
