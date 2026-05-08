import { uploadToR2 } from "../services/r2Uploader";
import { extractReceiptData } from "../services/geminiVision";
import { validateReceiptData } from "../validators/receiptSchema";
import { insertReceipt } from "../services/supabaseWriter";
import { appendReceiptToIndex } from "../utils/memory";
import { scheduleAlerts } from "../queue/producer";
import { log, logError } from "../utils/logger";

/**
 * Core receipt processing pipeline.
 * Can be called via WhatsApp webhook (after downloading media) or via REST API.
 */
export async function processReceiptBuffer(
  imageBuffer: Buffer,
  userPhone: string
): Promise<{ receiptId: string; validatedData: any }> {
  try {
    const r2Url = await uploadToR2(imageBuffer, userPhone);
    const rawJson = await extractReceiptData(imageBuffer);
    const validatedData = validateReceiptData(rawJson);
    const receiptId = await insertReceipt(validatedData, r2Url, userPhone);

    await appendReceiptToIndex({
      date: validatedData.purchase_date || new Date().toISOString().split("T")[0],
      store: validatedData.store_name,
      amount: validatedData.total_amount,
      currency: validatedData.currency,
      id: receiptId,
    });

    await scheduleAlerts(receiptId, userPhone, validatedData);
    log(`Receipt processed successfully via pipeline: ${receiptId}`);

    return { receiptId, validatedData };
  } catch (error) {
    logError("Pipeline processing failed", error);
    throw error;
  }
}
