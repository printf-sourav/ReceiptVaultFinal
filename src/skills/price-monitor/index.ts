import { supabase } from "../../services/supabaseWriter";
import { sendNotification } from "../../services/notificationSender";
import { getUserPrefs } from "../../utils/memory";
import { isWithinQuietHours, canSendAlert } from "../../utils/alertHelpers";
import { log, logError } from "../../utils/logger";

type PriceRow = {
  id: string;
  user_phone: string;
  item_name: string;
  store_name: string;
  unit_price: number;
  currency: string;
  purchased_at: string;
};

const PRICE_DROP_PERCENT_THRESHOLD = 10;

async function syncPriceHistoryFromReceipts(): Promise<number> {
  const { data: itemRows, error: itemError } = await supabase
    .from("receipt_items")
    .select("receipt_id, name, unit_price, receipts!inner(user_id, user_phone, store_name, currency, purchase_date)")
    .limit(5000);

  if (itemError) {
    logError("Price Monitor: failed to read receipt items for sync", itemError);
    return 0;
  }

  if (!itemRows || itemRows.length === 0) {
    return 0;
  }

  const receiptIds = [...new Set(itemRows.map((row: any) => row.receipt_id).filter(Boolean))];
  const existingKeySet = new Set<string>();

  if (receiptIds.length > 0) {
    const { data: existingRows, error: existingError } = await supabase
      .from("price_history")
      .select("receipt_id, item_name")
      .in("receipt_id", receiptIds);

    if (existingError) {
      logError("Price Monitor: failed to read existing history rows", existingError);
      return 0;
    }

    for (const row of existingRows || []) {
      const key = `${row.receipt_id}:${String(row.item_name || "").trim().toLowerCase()}`;
      existingKeySet.add(key);
    }
  }

  const inserts: any[] = [];
  for (const row of itemRows as any[]) {
    const receipt = row.receipts;
    const itemName = String(row.name || "").trim().toLowerCase();
    const unitPrice = Number(row.unit_price || 0);
    if (!receipt || !itemName || unitPrice <= 0 || !row.receipt_id) continue;

    const dedupeKey = `${row.receipt_id}:${itemName}`;
    if (existingKeySet.has(dedupeKey)) continue;

    inserts.push({
      user_id: receipt.user_id || null,
      user_phone: receipt.user_phone,
      item_name: itemName,
      store_name: receipt.store_name || "Unknown",
      unit_price: unitPrice,
      currency: receipt.currency || "INR",
      receipt_id: row.receipt_id,
      purchased_at: receipt.purchase_date,
    });
  }

  if (inserts.length === 0) {
    return 0;
  }

  const { error: insertError } = await supabase.from("price_history").insert(inserts);
  if (insertError) {
    logError("Price Monitor: failed to insert synced history rows", insertError);
    return 0;
  }

  return inserts.length;
}

export async function runPriceMonitor(): Promise<void> {
  log("Running Price Monitor skill...");

  try {
    const syncedCount = await syncPriceHistoryFromReceipts();
    if (syncedCount > 0) {
      log(`Price Monitor: synced ${syncedCount} price_history rows from receipts`);
    }

    const recentDate = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];

    const { data: recentRows, error: recentError } = await supabase
      .from("price_history")
      .select("id, user_phone, item_name, store_name, unit_price, currency, purchased_at")
      .gte("purchased_at", recentDate)
      .order("purchased_at", { ascending: false })
      .limit(1500);

    if (recentError) {
      logError("Price Monitor: failed to query recent history", recentError);
      return;
    }

    if (!recentRows || recentRows.length === 0) {
      log("Price Monitor: no recent price history rows");
      return;
    }

    for (const row of recentRows as PriceRow[]) {
      const { data: previousRows, error: previousError } = await supabase
        .from("price_history")
        .select("unit_price, purchased_at")
        .eq("user_phone", row.user_phone)
        .eq("item_name", row.item_name)
        .lt("purchased_at", row.purchased_at)
        .order("purchased_at", { ascending: false })
        .limit(20);

      if (previousError) {
        logError(`Price Monitor: failed to get previous prices for ${row.item_name}`, previousError);
        continue;
      }

      if (!previousRows || previousRows.length < 2) {
        continue;
      }

      const previousMin = Math.min(...previousRows.map((p: any) => Number(p.unit_price || 0)).filter((p: number) => p > 0));
      if (!Number.isFinite(previousMin) || previousMin <= 0) {
        continue;
      }

      const currentPrice = Number(row.unit_price || 0);
      const dropPercent = ((previousMin - currentPrice) / previousMin) * 100;

      if (dropPercent < PRICE_DROP_PERCENT_THRESHOLD) {
        continue;
      }

      const prefs = await getUserPrefs(row.user_phone);
      if (isWithinQuietHours(prefs)) continue;
      if (!canSendAlert(row.user_phone, prefs.max_alerts_per_hour)) continue;

      const itemName = row.item_name;
      const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(itemName)}`;
      const message = `Price drop detected for ${itemName}!\nNow: ${row.currency} ${currentPrice.toFixed(2)} at ${row.store_name}\nBest earlier: ${row.currency} ${previousMin.toFixed(2)}\nDrop: ${dropPercent.toFixed(1)}%\nBuy link: ${searchUrl}`;

      await sendNotification(row.user_phone, message);
      log(`Price Monitor alert sent: ${itemName} -> ${row.user_phone} (${dropPercent.toFixed(1)}%)`);
    }
  } catch (error) {
    logError("Price Monitor failed", error);
  }
}
