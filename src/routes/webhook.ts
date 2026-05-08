import { Router, Request, Response } from "express";
import { downloadMedia } from "../services/mediaDownloader";
import { uploadToR2 } from "../services/r2Uploader";
import { extractReceiptData } from "../services/geminiVision";
import { validateReceiptData } from "../validators/receiptSchema";
import { DuplicateReceiptError, insertReceipt } from "../services/supabaseWriter";
import { sendNotification, buildConfirmationMessage } from "../services/notificationSender";
import { appendReceiptToIndex } from "../utils/memory";
import { scheduleAlerts } from "../queue/producer";
import { log, logError } from "../utils/logger";
import { processReceiptBuffer } from "../utils/pipeline";

const router = Router();

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN!;

function normalizePhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (String(phone).startsWith("+")) return String(phone);
  return `+${digits}`;
}

router.get("/whatsapp", (req: Request, res: Response): void => {
  const mode = req.query["hub.mode"] as string | undefined;
  const token = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;

  if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
    log("Webhook verification successful");
    res.status(200).send(challenge);
    return;
  }

  log("Webhook verification failed");
  res.status(403).send("Forbidden");
});

router.post("/whatsapp", (req: Request, res: Response): void => {
  res.status(200).send("EVENT_RECEIVED");

  try {
    const entry = req.body?.entry;
    if (!entry || !entry[0]?.changes?.[0]?.value?.messages) {
      return;
    }

    const value = entry[0].changes[0].value;
    const sender: string = normalizePhone(value.contacts[0].wa_id);
    const message = value.messages[0];

    if (message.type !== "image") {
      if (message.type === "text" && message.text?.body?.toLowerCase() === "cancel") {
        handleCancelIntent(sender);
      } else {
        sendNotification(sender, "Please send a photo of your receipt.").catch((e) =>
          logError("Failed to send non-image reply", e)
        );
      }
      return;
    }

    processIncomingImage(message.image.id, sender).catch((e) =>
      logError("Pipeline error", e)
    );
  } catch (error) {
    logError("Webhook POST processing error", error);
  }
});

async function processIncomingImage(mediaId: string, senderPhone: string): Promise<void> {
  try {
    const imageBuffer = await downloadMedia(mediaId);
    const { validatedData } = await processReceiptBuffer(imageBuffer, senderPhone);
    
    await sendNotification(senderPhone, buildConfirmationMessage(validatedData));
  } catch (error) {
    if (error instanceof DuplicateReceiptError) {
      await sendNotification(senderPhone, "This receipt is already saved in your vault. I won't add it again.").catch(() => {});
      return;
    }
    logError("Receipt processing failed", error);
    await sendNotification(
      senderPhone,
      "Sorry, I had trouble reading that receipt. Please try sending a clearer photo."
    ).catch(() => {});
  }
}

async function handleCancelIntent(userPhone: string): Promise<void> {
  const { supabase } = await import("../services/supabaseWriter");
  const { saveUserPrefs, getUserPrefs } = await import("../utils/memory");
  const fs = await import("fs/promises");
  const path = await import("path");

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_phone", userPhone)
    .eq("status", "active")
    .order("renewal_date", { ascending: true })
    .limit(1);

  if (!subs || subs.length === 0) {
    await sendNotification(userPhone, "No active subscription found to cancel.");
    return;
  }

  const sub = subs[0];
  const prefs = await getUserPrefs(userPhone);
  await saveUserPrefs(userPhone, {
    ...prefs,
    auto_actions_approved: [...prefs.auto_actions_approved, `cancel_intent:${sub.service_name}`],
  });

  const logPath = path.resolve(__dirname, "../../logs/cancellation-intents.json");
  try {
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    let existing: unknown[] = [];
    try {
      const content = await fs.readFile(logPath, "utf-8");
      existing = JSON.parse(content);
    } catch {}
    existing.push({ userPhone, service_name: sub.service_name, timestamp: new Date().toISOString() });
    await fs.writeFile(logPath, JSON.stringify(existing, null, 2), "utf-8");
  } catch (e) {
    logError("Failed to log cancellation intent", e);
  }

  await sendNotification(
    userPhone,
    `Got it. I've noted your intent to cancel ${sub.service_name}. Cancel directly here: ${sub.cancellation_url || "N/A"}`
  );
}

export default router;
