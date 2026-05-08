import { supabase } from "../../services/supabaseWriter";
import { sendNotification } from "../../services/notificationSender";
import { log, logError } from "../../utils/logger";

export async function runSpendingDashboard(): Promise<void> {
  if (new Date().getDay() !== 1) return;

  log("Running Spending Dashboard skill (Monday)...");

  try {
    const { data: users, error: usersError } = await supabase
      .from("receipts")
      .select("user_phone")
      .limit(1000);

    if (usersError || !users) {
      logError("Spending Dashboard: failed to get users", usersError);
      return;
    }

    const uniquePhones = [...new Set(users.map((u) => u.user_phone))];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    for (const userPhone of uniquePhones) {
      const { data: receipts, error } = await supabase
        .from("receipts")
        .select("store_name, total_amount, currency")
        .eq("user_phone", userPhone)
        .gte("purchase_date", sevenDaysAgo);

      if (error || !receipts || receipts.length === 0) continue;

      const currency = receipts[0].currency || "INR";
      const totalSpent = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);

      const byStore: Record<string, number> = {};
      let biggestPurchase = { store_name: "", amount: 0 };

      for (const r of receipts) {
        const store = r.store_name || "Unknown";
        byStore[store] = (byStore[store] || 0) + r.total_amount;
        if (r.total_amount > biggestPurchase.amount) {
          biggestPurchase = { store_name: store, amount: r.total_amount };
        }
      }

      const breakdown = Object.entries(byStore)
        .sort(([, a], [, b]) => b - a)
        .map(([store, amount]) => `— ${store}: ${currency} ${amount}`)
        .join("\n");

      const message = `Your week in spending:\nTotal: ${currency} ${totalSpent}\nBreakdown:\n${breakdown}\nBiggest purchase: ${biggestPurchase.store_name} — ${currency} ${biggestPurchase.amount}\nHave a budget-friendly week ahead!`;

      await sendNotification(userPhone, message);
      log(`Spending summary sent to ${userPhone}: ${currency} ${totalSpent}`);
    }
  } catch (error) {
    logError("Spending Dashboard failed", error);
  }
}
