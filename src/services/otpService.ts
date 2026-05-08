import { sendNotification } from "./notificationSender";
import { log, logError } from "../utils/logger";

// In-memory OTP store: phone -> { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  // Strip + prefix and spaces, ensure just digits
  let cleaned = phone.replace(/[\s\-\+]/g, "");
  // If starts with 91 and is 12 digits, it's an Indian number
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
}

export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = normalizePhone(phone);
    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    otpStore.set(normalized, { otp, expiresAt });

    const message = `🔐 *ReceiptVault* — Your verification code:\n\n*${otp}*\n\nValid for 5 minutes. Do not share this code.`;
    await sendNotification(normalized, message);

    log(`OTP sent to ${normalized}`);
    return { success: true };
  } catch (error: any) {
    logError(`Failed to send OTP to ${phone}`, error);
    return { success: false, error: error.message || "Failed to send OTP" };
  }
}

export function verifyOtp(phone: string, code: string): { valid: boolean; error?: string } {
  const normalized = normalizePhone(phone);
  const entry = otpStore.get(normalized);

  if (!entry) {
    return { valid: false, error: "No OTP requested for this number" };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalized);
    return { valid: false, error: "OTP expired. Please request a new one." };
  }

  if (entry.otp !== code) {
    return { valid: false, error: "Invalid OTP" };
  }

  // OTP verified — remove from store
  otpStore.delete(normalized);
  log(`OTP verified for ${normalized}`);
  return { valid: true };
}
