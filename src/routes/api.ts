import { Router, Request, Response } from "express";
import multer from "multer";
import { supabase, insertReceipt, DuplicateReceiptError } from "../services/supabaseWriter";
import { extractReceiptData } from "../services/geminiVision";
import { validateReceiptData } from "../validators/receiptSchema";
import { uploadToR2 } from "../services/r2Uploader";
import { log, logError } from "../utils/logger";
import { sendOtp, verifyOtp } from "../services/otpService";
import { google } from "googleapis";
import { scanUserGmail } from "../services/gmailScanner";
import axios from "axios";
import * as cheerio from "cheerio";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// ---------- PUBLIC AUTH ROUTES (no auth required) ----------

// POST /api/auth/send-otp — sends OTP to WhatsApp
router.post("/auth/send-otp", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: "Valid phone number required" });
    }

    const canonicalPhone = normalizePhone(phone);

    const result = await sendOtp(canonicalPhone);
    if (result.success) {
      res.json({ success: true, message: "OTP sent to your WhatsApp" });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (e: any) {
    logError("API /auth/send-otp error", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/verify-otp — verifies OTP for existing users only
router.post("/auth/verify-otp", async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP required" });
    }

    const canonicalPhone = normalizePhone(phone);
    const result = verifyOtp(canonicalPhone, otp);
    if (!result.valid) {
      return res.status(401).json({ success: false, error: result.error });
    }

    // OTP valid — find user or create one
    const { data: users } = await supabase
      .from("users")
      .select("id, phone, email, display_name, created_at")
      .in("phone", getPhoneVariants(phone))
      .order("created_at", { ascending: false })
      .limit(1);

    let user = users?.[0];

    if (!user) {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          phone: canonicalPhone,
          last_active_at: new Date().toISOString(),
        })
        .select("id, phone, email, display_name, created_at")
        .single();
        
      if (error) throw error;
      user = newUser;
      return res.json({ success: true, user, isNew: true });
    }

    res.json({ success: true, user, isNew: false });
  } catch (e: any) {
    logError("API /auth/verify-otp error", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/registration-status — checks whether an OAuth user is already linked to a phone
router.post("/auth/registration-status", async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: "Email or phone required" });
    }

    let query = supabase.from("users").select("id, phone, display_name, email");

    if (email) {
      query = query.eq("email", email).limit(1);
    } else if (phone) {
      query = query.in("phone", getPhoneVariants(phone)).limit(1);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return res.json({ registered: false });
    }

    res.json({
      registered: true,
      user: data,
      phone: data.phone,
      email: data.email,
    });
  } catch (e: any) {
    logError("API /auth/registration-status error", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/register-oauth — links a Google user to a phone number
router.post("/auth/register-oauth", async (req: Request, res: Response) => {
  try {
    const { phone, email, displayName, emailVerified, otp } = req.body;

    if (!phone || !email) {
      return res.status(400).json({ error: "Phone and email are required" });
    }

    if (!emailVerified) {
      return res.status(400).json({ error: "Email verification is required for registration" });
    }

    const canonicalPhone = normalizePhone(phone);

    // OTP is optional for OAuth completion flow.
    // If provided, validate it. If not provided, proceed with trusted OAuth session + email verification.
    if (otp) {
      const otpResult = verifyOtp(canonicalPhone, otp);
      if (!otpResult.valid) {
        return res.status(401).json({ error: otpResult.error });
      }
    }

    const { data: existingByPhoneRows } = await supabase
      .from("users")
      .select("id, phone, email, display_name")
      .in("phone", getPhoneVariants(phone))
      .order("created_at", { ascending: false })
      .limit(1);

    const existingByPhone = existingByPhoneRows?.[0];

    if (existingByPhone) {
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({
          email,
          phone: canonicalPhone,
          display_name: displayName || existingByPhone.display_name,
          last_active_at: new Date().toISOString(),
        })
        .eq("id", existingByPhone.id)
        .select("id, phone, email, display_name")
        .single();

      if (error) throw error;
      return res.json({ success: true, user: updatedUser, isNew: false });
    }

    const { data: existingByEmailRows } = await supabase
      .from("users")
      .select("id, phone, email, display_name")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    const existingByEmail = existingByEmailRows?.[0];

    if (existingByEmail) {
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({
          phone: canonicalPhone,
          display_name: displayName || existingByEmail.display_name,
          last_active_at: new Date().toISOString(),
        })
        .eq("id", existingByEmail.id)
        .select("id, phone, email, display_name")
        .single();

      if (error) throw error;
      return res.json({ success: true, user: updatedUser, isNew: false });
    }

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        phone: canonicalPhone,
        email,
        display_name: displayName || null,
        last_active_at: new Date().toISOString(),
      })
      .select("id, phone, email, display_name")
      .single();

    if (error) throw error;

    if (email) {
      await supabase.from("gmail_accounts").upsert({
        user_id: newUser.id,
        email,
        google_refresh_token: null,
        consented_at: new Date().toISOString(),
        status: "pending",
      }, { onConflict: "user_id" });
    }

    res.json({ success: true, user: newUser, isNew: true });
  } catch (e: any) {
    logError("API /auth/register-oauth error", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/google-consent — store Gmail refresh token after consent
router.post("/auth/google-consent", async (req: Request, res: Response) => {
  try {
    const { userId, email, refreshToken } = req.body;

    if (!userId || !email || !refreshToken) {
      return res.status(400).json({ error: "userId, email and refreshToken are required" });
    }

    const { error } = await supabase.from("gmail_accounts").upsert({
      user_id: userId,
      email,
      google_refresh_token: refreshToken,
      consented_at: new Date().toISOString(),
      status: "active",
    }, { onConflict: "user_id" });

    if (error) throw error;

    res.json({ success: true });
  } catch (e: any) {
    logError("API /auth/google-consent error", e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/oauth-config — returns available OAuth providers
router.get("/auth/oauth-config", (_req: Request, res: Response) => {
  const googleConfigured = Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );

  res.json({
    success: true,
    providers: {
      google: googleConfigured,
    },
  });
});

// GET /api/auth/google-url — generate Google OAuth consent URL
router.get("/auth/google-url", (_req: Request, res: Response) => {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({
        success: false,
        error: "Google OAuth is not configured on the server",
      });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["openid", "email", "profile"],
    });

    res.json({ success: true, url });
  } catch (e: any) {
    logError("API /auth/google-url error", e);
    res.status(500).json({ success: false, error: "Failed to generate Google OAuth URL" });
  }
});

// POST /api/test-link-gmail — TEST ONLY: manually link a Gmail account for testing
router.post("/test-link-gmail", async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "This endpoint is disabled in production" });
    }

    const { phone, email, refreshToken } = req.body;

    if (!phone || !email || !refreshToken) {
      return res.status(400).json({ error: "phone, email, and refreshToken are required" });
    }

    const canonicalPhone = normalizePhone(phone);

    // Get user ID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("phone", canonicalPhone)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Upsert gmail account with test token
    const { data, error } = await supabase
      .from("gmail_accounts")
      .upsert({
        user_id: user.id,
        email,
        google_refresh_token: refreshToken,
        status: "active",
        consented_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      logError("Test link Gmail error", error);
      return res.status(500).json({ error: error.message });
    }

    log(`✅ TEST: Gmail account linked for ${canonicalPhone}`);
    res.json({ success: true, message: "Gmail account linked for testing" });
  } catch (e: any) {
    logError("API /test-link-gmail error", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/test-gmail-api — TEST ONLY: test Gmail API connectivity
router.post("/test-gmail-api", async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Disabled in production" });
    }

    const { refreshToken, query } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken required" });
    }

    const credentials = require("../../credentials.json");
    const { client_id, client_secret, redirect_uris } = credentials.installed;

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Try to list emails with optional query
    const finalQuery = query || "newer_than:1d";
    log(`📧 Testing Gmail query: ${finalQuery}`);
    
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
      q: finalQuery,
    });

    const messages = response.data.messages || [];
    log(`✅ Gmail API test: found ${messages.length} emails with query "${finalQuery}"`);

    res.json({
      success: true,
      query: finalQuery,
      messagesFound: messages.length,
      messageIds: messages.map((m) => m.id),
    });
  } catch (error: any) {
    logError("Gmail API test error", error);
    res.json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

// ---------- AUTH MIDDLEWARE ----------
function requirePhone(req: Request, res: Response, next: Function) {
  const phone = req.headers["x-user-phone"] as string;
  if (!phone) {
    return res.status(401).json({ error: "Missing X-User-Phone header" });
  }
  (req as any).userPhone = normalizePhone(phone);
  next();
}

router.use(requirePhone);

// POST /api/trigger-gmail-scan — manually run the Gmail scan for the linked user
router.post("/trigger-gmail-scan", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const { data: account, error } = await supabase
      .from("gmail_accounts")
      .select("email, google_refresh_token, status")
      .eq("status", "active")
      .eq("user_id", user.id)
      .single();

    if (error || !account) {
      return res.status(404).json({ success: false, error: "No linked Gmail account found" });
    }

    if (!account.google_refresh_token) {
      return res.status(400).json({ success: false, error: "Gmail consent not completed yet" });
    }

    await scanUserGmail(phone, account.google_refresh_token);
    res.json({ success: true });
  } catch (e: any) {
    logError("API /trigger-gmail-scan error", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ---------- POST /api/upload-receipt ----------
router.post("/upload-receipt", upload.single("receipt"), async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No receipt image uploaded" });
    }

    log(`[upload] Received ${file.size} bytes from ${phone}`);

    // 1. Upload to R2
    let r2Url = "";
    try {
      r2Url = await uploadToR2(file.buffer, phone.replace(/\+/g, ""));
    } catch (e: any) {
      logError("[upload] R2 upload failed, continuing without image URL", e);
    }

    // 2. Extract receipt data with Gemini Vision
    const rawData = await extractReceiptData(file.buffer);

    // 3. Validate with Zod
    const validated = validateReceiptData(rawData);

    // 4. Insert into Supabase
    const receiptId = await insertReceipt(validated, r2Url, phone);

    // 5. Return the new receipt
    const { data: receipt } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("id", receiptId)
      .single();

    res.json({
      success: true,
      receipt: receipt ? mapReceipt(receipt) : { id: receiptId },
    });
  } catch (e: any) {
    if (e instanceof DuplicateReceiptError) {
      return res.status(409).json({
        success: false,
        error: e.message,
        duplicate: true,
        receiptId: e.receiptId,
      });
    }
    logError("API /upload-receipt error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/receipts ----------
router.get("/receipts", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { category, search, limit } = req.query;

    let query = supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("user_phone", phone)
      .order("purchase_date", { ascending: false });

    if (limit) query = query.limit(Number(limit));

    const { data, error } = await query;
    if (error) throw error;

    let receipts = data || [];
    if (category && category !== "All") {
      receipts = receipts.filter(
        (r: any) =>
          (r.category || guessCategory(r.store_name, r.receipt_items)).toLowerCase() ===
          (category as string).toLowerCase()
      );
    }
    if (search) {
      const q = (search as string).toLowerCase();
      receipts = receipts.filter(
        (r: any) =>
          r.store_name?.toLowerCase().includes(q) ||
          r.receipt_items?.some((i: any) => i.name?.toLowerCase().includes(q))
      );
    }

    res.json(receipts.map(mapReceipt));
  } catch (e: any) {
    logError("API /receipts error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/receipts/:id ----------
router.get("/receipts/:id", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { id } = req.params;

    const { data: receipt, error } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("id", id)
      .eq("user_phone", phone)
      .single();

    if (error || !receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    res.json(mapReceipt(receipt));
  } catch (e: any) {
    logError("API /receipts/:id error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- DELETE /api/receipts/:id ----------
router.delete("/receipts/:id", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { id } = req.params;

    const { error: itemsError } = await supabase
      .from("receipt_items")
      .delete()
      .eq("receipt_id", id);

    if (itemsError) throw itemsError;

    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("id", id)
      .eq("user_phone", phone);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e: any) {
    logError("API DELETE /receipts/:id error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- DELETE /api/receipts (delete all receipts for user) ----------
router.delete("/receipts", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { data: receipts, error: lookupError } = await supabase
      .from("receipts")
      .select("id")
      .eq("user_phone", phone);

    if (lookupError) throw lookupError;

    const ids = (receipts || []).map((r: any) => r.id);
    if (ids.length > 0) {
      const { error: itemsError } = await supabase
        .from("receipt_items")
        .delete()
        .in("receipt_id", ids);

      if (itemsError) throw itemsError;
    }

    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("user_phone", phone);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e: any) {
    logError("API DELETE /receipts error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/export (export user's receipts as JSON) ----------
router.get("/export", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { data, error } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("user_phone", phone)
      .order("purchase_date", { ascending: false });

    if (error) throw error;

    const exportData = (data || []).map(mapReceipt);

    // Return JSON export
    res.json({ exportedAt: new Date().toISOString(), receipts: exportData });
  } catch (e: any) {
    logError("API /export error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/analytics/spending ----------
router.get("/analytics/spending", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { period = "week" } = req.query;

    const { data, error } = await supabase
      .from("receipts")
      .select("total_amount, purchase_date")
      .eq("user_phone", phone);

    if (error) throw error;

    const receipts = data || [];
    const now = new Date();
    let grouped: Record<string, number> = {};

    if (period === "week") {
      // Group by day of week for the last 7 days
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        grouped[daysOfWeek[d.getDay()]] = 0;
      }

      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      receipts.forEach((r: any) => {
        const date = new Date(r.purchase_date);
        if (date >= sevenDaysAgo && date <= now) {
          const dayOfWeek = daysOfWeek[date.getDay()];
          if (grouped[dayOfWeek] !== undefined) {
            grouped[dayOfWeek] += r.total_amount || 0;
          }
        }
      });

      const result = Object.keys(grouped).map((day) => ({
        day,
        amount: Math.round(grouped[day]),
      }));
      return res.json(result);
    }

    if (period === "month") {
      // Group by month (last 6 months)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const bucketKeys: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
        bucketKeys.push(key);
        grouped[key] = 0;
      }

      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      
      receipts.forEach((r: any) => {
        const date = new Date(r.purchase_date);
        if (date >= sixMonthsAgo && date <= now) {
          const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
          if (grouped[key] !== undefined) {
            grouped[key] += r.total_amount || 0;
          }
        }
      });

      const result = bucketKeys.map((key) => ({
        month: key.split(' ')[0], // Frontend might just expect the month name
        amount: Math.round(grouped[key]),
      }));
      return res.json(result);
    }

    if (period === "year") {
      // Group by month for last 12 months
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const bucketKeys: string[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
        bucketKeys.push(key);
        grouped[key] = 0;
      }

      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      receipts.forEach((r: any) => {
        const date = new Date(r.purchase_date);
        if (date >= twelveMonthsAgo && date <= now) {
          const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
          if (grouped[key] !== undefined) {
            grouped[key] += r.total_amount || 0;
          }
        }
      });

      const result = bucketKeys.map((key) => ({
        month: key.split(' ')[0],
        amount: Math.round(grouped[key]),
      }));
      return res.json(result);
    }

    res.json([]);
  } catch (e: any) {
    logError("API /analytics/spending error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/analytics/categories ----------
router.get("/analytics/categories", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;

    const { data, error } = await supabase
      .from("receipts")
      .select("store_name, total_amount, receipt_items(*)")
      .eq("user_phone", phone);

    if (error) throw error;

    const receipts = data || [];
    const categoryMap: Record<string, { amount: number; emoji: string; color: string }> = {
      Electronics: { amount: 0, emoji: "⚡", color: "#63B3ED" },
      Food: { amount: 0, emoji: "🍕", color: "#F6AD55" },
      Fashion: { amount: 0, emoji: "👗", color: "#B794F4" },
      Groceries: { amount: 0, emoji: "🛒", color: "#68D391" },
      Health: { amount: 0, emoji: "💊", color: "#FC8181" },
      Other: { amount: 0, emoji: "📦", color: "#4A5568" },
    };

    receipts.forEach((r: any) => {
      const category = guessCategory(r.store_name, r.receipt_items || []);
      const cat = categoryMap[category] || categoryMap["Other"];
      cat.amount += r.total_amount || 0;
    });

    const total = Object.values(categoryMap).reduce((s, c) => s + c.amount, 0);
    const result = Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        amount: Math.round(data.amount),
        percent: total > 0 ? Math.round((data.amount / total) * 100) : 0,
        emoji: data.emoji,
        color: data.color,
      }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    res.json(result);
  } catch (e: any) {
    logError("API /analytics/categories error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/analytics/top-merchants ----------
router.get("/analytics/top-merchants", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;

    const { data, error } = await supabase
      .from("receipts")
      .select("store_name, total_amount")
      .eq("user_phone", phone);

    if (error) throw error;

    const receipts = data || [];
    const merchantMap: Record<string, number> = {};

    receipts.forEach((r: any) => {
      merchantMap[r.store_name] = (merchantMap[r.store_name] || 0) + (r.total_amount || 0);
    });

    const result = Object.entries(merchantMap)
      .map(([store, amount], index) => ({
        rank: index + 1,
        store,
        amount: Math.round(amount),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    res.json(result);
  } catch (e: any) {
    logError("API /analytics/top-merchants error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/dashboard/stats ----------
router.get("/dashboard/stats", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;

    const { data, error } = await supabase
      .from("receipts")
      .select("return_deadline_date, warranty_expiry_date, purchase_date, total_amount")
      .eq("user_phone", phone);

    if (error) throw error;

    const receipts = data || [];
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalReceipts: receipts.length,
      returnsExpiring: receipts.filter(
        (r: any) => r.return_deadline_date && new Date(r.return_deadline_date) <= oneWeekFromNow && new Date(r.return_deadline_date) >= now
      ).length,
      warrantyActive: receipts.filter(
        (r: any) => r.warranty_expiry_date && new Date(r.warranty_expiry_date) >= now
      ).length,
      thisMonthSpend: Math.round(
        receipts
          .filter((r: any) => new Date(r.purchase_date) >= oneMonthAgo)
          .reduce((s: number, r: any) => s + (r.total_amount || 0), 0)
      ),
    };

    res.json(stats);
  } catch (e: any) {
    logError("API /dashboard/stats error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/analytics/price-monitor ----------
router.get("/analytics/price-monitor", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { limit = "20" } = req.query;
    const maxRows = Math.min(Number(limit) || 20, 100);

    const { data, error } = await supabase
      .from("price_history")
      .select("item_name, store_name, unit_price, currency, purchased_at")
      .eq("user_phone", phone)
      .order("purchased_at", { ascending: false })
      .limit(2000);

    if (error) throw error;

    const rows = data || [];
    const byItem = new Map<string, any[]>();

    for (const row of rows as any[]) {
      const key = String(row.item_name || "").trim().toLowerCase();
      if (!key) continue;
      if (!byItem.has(key)) byItem.set(key, []);
      byItem.get(key)!.push(row);
    }

    const result = Array.from(byItem.entries())
      .map(([itemName, itemRows]) => {
        const sortedRows = itemRows.sort((a: any, b: any) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime());
        const latest = sortedRows[0];
        const previous = sortedRows.slice(1);
        const bestHistorical = previous.length > 0
          ? Math.min(...previous.map((r: any) => Number(r.unit_price || 0)).filter((n: number) => n > 0))
          : Number(latest.unit_price || 0);
        const latestPrice = Number(latest.unit_price || 0);
        const delta = latestPrice - bestHistorical;
        const deltaPercent = bestHistorical > 0 ? (delta / bestHistorical) * 100 : 0;

        return {
          itemName,
          latestPrice,
          currency: latest.currency,
          latestStore: latest.store_name,
          latestPurchasedAt: latest.purchased_at,
          bestHistoricalPrice: bestHistorical,
          delta,
          deltaPercent,
          trend: delta < 0 ? "down" : delta > 0 ? "up" : "flat",
          observations: sortedRows.length,
        };
      })
      .sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent))
      .slice(0, maxRows);

    res.json(result);
  } catch (e: any) {
    logError("API /analytics/price-monitor error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/price-history ----------
// Query price history by platform name and/or product name
// Usage: /api/price-history?platform=Walmart&product=milk
router.get("/price-history", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { platform, product, limit = "100" } = req.query;
    const maxRows = Math.min(Number(limit) || 100, 500);

    let query = supabase
      .from("price_history")
      .select("id, item_name, store_name, unit_price, currency, purchased_at, receipt_id");

    // Apply filters
    if (phone) {
      query = query.eq("user_phone", phone);
    }
    if (platform) {
      query = query.ilike("store_name", `%${platform}%`);
    }
    if (product) {
      query = query.ilike("item_name", `%${product}%`);
    }

    const { data, error } = await query
      .order("purchased_at", { ascending: false })
      .limit(maxRows);

    if (error) throw error;

    const result = (data || []).map((row: any) => ({
      id: row.id,
      productName: row.item_name,
      platformName: row.store_name,
      unitPrice: Number(row.unit_price),
      currency: row.currency,
      purchasedAt: row.purchased_at,
      receiptId: row.receipt_id,
    }));

    res.json({
      total: result.length,
      data: result,
      filters: {
        platform: platform || null,
        product: product || null,
      },
    });
  } catch (e: any) {
    logError("API /price-history error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- POST /api/price-history/record ----------
// Manually record a current market price for price comparison
// Usage: POST /api/price-history/record
// Body: { platformName, productName, currentPrice, currency }
router.post("/price-history/record", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { platformName, productName, currentPrice, currency = "INR" } = req.body;

    if (!platformName || !productName || currentPrice === undefined) {
      return res.status(400).json({ error: "platformName, productName, and currentPrice are required" });
    }

    const { data, error } = await supabase.from("price_history").insert({
      user_phone: phone,
      item_name: String(productName).toLowerCase().trim(),
      store_name: String(platformName).trim(),
      unit_price: Number(currentPrice),
      currency: currency,
      purchased_at: new Date().toISOString().split("T")[0], // Today's date
    }).select("*");

    if (error) throw error;

    const record = data?.[0];
    res.json({
      success: true,
      message: `Recorded current price for "${productName}" on ${platformName}`,
      recorded: {
        productName: record?.item_name,
        platformName: record?.store_name,
        currentPrice: Number(record?.unit_price),
        currency: record?.currency,
        recordedAt: record?.created_at,
      },
    });
  } catch (e: any) {
    logError("API /price-history/record error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- GET /api/price-comparison/:productId ----------
// Compare price of a product across time and platforms
// Shows original purchase price vs current market price
router.get("/price-comparison/:productId", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { productId } = req.params;

    const { data, error } = await supabase
      .from("price_history")
      .select("item_name, store_name, unit_price, currency, purchased_at")
      .eq("user_phone", phone)
      .eq("receipt_id", productId)
      .order("purchased_at", { ascending: true });

    if (error) throw error;

    const rows = data || [];
    if (rows.length === 0) {
      return res.json({ error: "No price history found for this product" });
    }

    const firstPurchase = rows[0];
    const latestPrice = rows[rows.length - 1];
    const originalPrice = Number(firstPurchase.unit_price);
    const currentPrice = Number(latestPrice.unit_price);
    const priceDelta = currentPrice - originalPrice;
    const deltaPercent = originalPrice > 0 ? (priceDelta / originalPrice) * 100 : 0;

    res.json({
      productName: firstPurchase.item_name,
      platform: firstPurchase.store_name,
      originalPrice,
      originalPurchaseDate: firstPurchase.purchased_at,
      currentPrice,
      lastRecordedDate: latestPrice.purchased_at,
      priceDelta,
      deltaPercent: deltaPercent.toFixed(2),
      trend: priceDelta < 0 ? "down" : priceDelta > 0 ? "up" : "flat",
      savings: Math.abs(priceDelta),
      currency: latestPrice.currency,
      priceHistory: rows.map((r: any) => ({
        date: r.purchased_at,
        price: Number(r.unit_price),
        store: r.store_name,
      })),
    });
  } catch (e: any) {
    logError("API /price-comparison error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- POST /api/fetch-current-price ----------
// Fetch current price from Myntra website using RapidAPI
// Usage: POST /api/fetch-current-price
// Body: { productName, myntraUrl } OR { productName } to search
router.post("/fetch-current-price", async (req: Request, res: Response) => {
  try {
    const phone = (req as any).userPhone;
    const { productName, myntraUrl } = req.body;

    if (!productName) {
      return res.status(400).json({ error: "productName is required" });
    }

    let price: number | null = null;
    let foundUrl = myntraUrl;
    let productTitle = productName;

    // If URL provided, scrape directly using RapidAPI
    if (myntraUrl) {
      const result = await fetchPriceFromRapidAPI(myntraUrl);
      if (result) {
        price = result.price;
        productTitle = result.title || productName;
        foundUrl = result.url || myntraUrl;
      }
    } else {
      // Search for product on Myntra using RapidAPI
      const searchResults = await searchMyntraViaRapidAPI(productName);
      if (searchResults.length > 0) {
        const topResult = searchResults[0];
        foundUrl = topResult.url;
        price = topResult.price;
        productTitle = topResult.title || productName;
      }
    }

    if (price === null) {
      return res.status(404).json({ 
        error: "Could not fetch price from Myntra",
        hint: "Make sure RAPID_API_KEY is set in .env. Get a free key from https://rapidapi.com"
      });
    }

    // Record the current price in database
    const { data: recorded, error: recordError } = await supabase.from("price_history").insert({
      user_phone: phone,
      item_name: String(productTitle).toLowerCase().trim(),
      store_name: "Myntra",
      unit_price: price,
      currency: "INR",
      purchased_at: new Date().toISOString().split("T")[0],
    }).select("*");

    if (recordError) throw recordError;

    // Get price history for comparison
    const { data: history } = await supabase
      .from("price_history")
      .select("unit_price, purchased_at")
      .eq("user_phone", phone)
      .ilike("item_name", `%${productTitle}%`)
      .eq("store_name", "Myntra")
      .order("purchased_at", { ascending: true });

    const historyRows = history || [];
    const originalPrice = historyRows.length > 1 ? Number(historyRows[0].unit_price) : price;
    const priceDelta = price - originalPrice;
    const deltaPercent = originalPrice > 0 ? (priceDelta / originalPrice) * 100 : 0;

    res.json({
      success: true,
      message: `✅ Price fetched from Myntra via RapidAPI`,
      currentPrice: price,
      originalPrice,
      priceDelta,
      deltaPercent: deltaPercent.toFixed(2),
      trend: priceDelta < 0 ? "down 📉" : priceDelta > 0 ? "up 📈" : "flat →",
      savings: Math.abs(priceDelta),
      productName: productTitle,
      myntraUrl: foundUrl,
      recordedAt: recorded?.[0]?.created_at,
      currency: "INR",
    });
  } catch (e: any) {
    logError("API /fetch-current-price error", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- HELPERS ----------
function normalizePhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (String(phone).startsWith("+")) return String(phone);
  return `+${digits}`;
}

function getPhoneVariants(phone: string): string[] {
  const digits = String(phone || "").replace(/\D/g, "");
  const canonical = normalizePhone(phone);
  const variants = new Set<string>([canonical]);

  if (digits.length === 10) {
    variants.add(`91${digits}`);
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    variants.add(digits);
    variants.add(`+${digits}`);
  }

  return [...variants];
}

function guessCategory(storeName: string, items: any[]): string {
  const name = storeName.toLowerCase();
  if (name.includes("grocery") || name.includes("supermarket")) return "Groceries";
  if (name.includes("pharmacy") || name.includes("medical")) return "Health";
  if (name.includes("restaurant") || name.includes("cafe")) return "Food";
  if (name.includes("electronic")) return "Electronics";
  return "Other";
}

function getReceiptItems(receipt: any): Array<{ name: string; quantity: number; price: number }> {
  const dbItems = (receipt.receipt_items || [])
    .map((item: any) => ({
      name: String(item.name || "").trim(),
      quantity: Number(item.quantity || 1),
      price: Number(item.unit_price || item.total_price || 0),
    }))
    .filter((item: any) => item.name.length > 0);

  if (dbItems.length > 0) return dbItems;

  const rawItems = Array.isArray(receipt.gemini_raw?.items) ? receipt.gemini_raw.items : [];
  return rawItems
    .map((item: any) => ({
      name: String(item?.name || "").trim(),
      quantity: Number(item?.quantity || 1),
      price: Number(item?.unit_price || item?.total_price || 0),
    }))
    .filter((item: any) => item.name.length > 0);
}

function mapReceipt(receipt: any) {
  const items = getReceiptItems(receipt);

  return {
    id: receipt.id,
    store: receipt.store_name,
    storeLogo: receipt.store_name?.substring(0, 2).toUpperCase() || "RCP",
    item: items[0]?.name || "Receipt",
    amount: receipt.total_amount,
    date: receipt.purchase_date,
    createdAt: receipt.created_at,
    category: guessCategory(receipt.store_name, items || []),
    paymentMode: "Unknown",
    returnDeadline: receipt.return_deadline_date,
    warrantyExpiry: receipt.warranty_expiry_date,
    imageUrl: receipt.r2_image_url,
    items,
    productNames: items.map((item) => item.name),
    aiExtracted: true,
  };
}

// ---------- WEB SCRAPING HELPERS (Using RapidAPI) ----------
async function fetchPriceFromRapidAPI(
  myntraUrl: string
): Promise<{ price: number; title: string; url: string } | null> {
  try {
    const apiKey = process.env.RAPID_API_KEY;
    const apiHost = process.env.RAPID_API_HOST;

    if (!apiKey || apiKey === "YOUR_RAPID_API_KEY_HERE") {
      logError("RapidAPI key not configured");
      return null;
    }

    // Extract product ID from Myntra URL
    const productIdMatch = myntraUrl.match(/\/p\/([a-z0-9]+)/i);
    if (!productIdMatch) {
      logError("Could not extract product ID from URL");
      return null;
    }

    const productId = productIdMatch[1];

    // Use RapidAPI for fetching price
    const options = {
      method: "GET",
      url: "https://real-time-amazon-data.p.rapidapi.com/search",
      params: {
        query: productId,
        page: "1",
        country: "IN",
      },
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
    };

    const response = await axios.request(options);
    const products = response.data?.data?.products || [];

    if (products.length > 0) {
      const product = products[0];
      const price = Number(product.price || 0);
      const title = product.title || "";

      if (price > 0) {
        log(`✅ Fetched price from RapidAPI: ₹${price}`);
        return { price, title, url: myntraUrl };
      }
    }

    return null;
  } catch (error: any) {
    logError("Error fetching from RapidAPI:", error.message);
    return null;
  }
}

async function searchMyntraViaRapidAPI(
  productName: string
): Promise<Array<{ url: string; price: number; title: string }>> {
  try {
    const apiKey = process.env.RAPID_API_KEY;
    const apiHost = process.env.RAPID_API_HOST;

    if (!apiKey || apiKey === "YOUR_RAPID_API_KEY_HERE") {
      logError("RapidAPI key not configured");
      return [];
    }

    const options = {
      method: "GET",
      url: "https://real-time-amazon-data.p.rapidapi.com/search",
      params: {
        query: `${productName} site:myntra.com`,
        page: "1",
        country: "IN",
      },
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
    };

    const response = await axios.request(options);
    const products = response.data?.data?.products || [];

    const results: Array<{ url: string; price: number; title: string }> = [];

    for (const product of products.slice(0, 5)) {
      const price = Number(product.price || 0);
      const title = product.title || productName;
      const asin = product.asin || "";

      if (price > 0) {
        const url = `https://www.myntra.com/p/${asin}`;
        results.push({ url, price, title });
      }
    }

    log(`🔍 Found ${results.length} products via RapidAPI`);
    return results;
  } catch (error: any) {
    logError("Error searching Myntra via RapidAPI:", error.message);
    return [];
  }
}

// Fallback local scraping (in case RapidAPI fails)
async function scrapeMytraPrice(url: string): Promise<number | null> {
  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };

    const { data } = await axios.get(url, { headers, timeout: 5000 });
    const $ = cheerio.load(data);

    // Try multiple selectors for price (Myntra might change their HTML)
    const priceSelectors = [
      '[class*="productDiscountedPriceText"]',
      '[class*="discountedPrice"]',
      '[class*="productPrice"]',
      "span[class*='price']",
    ];

    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text();
      const priceMatch = priceText.match(/₹[\s]?([0-9,]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
        if (!isNaN(price) && price > 0) {
          log(`✅ Scraped Myntra price (local): ₹${price}`);
          return price;
        }
      }
    }

    return null;
  } catch (error: any) {
    logError("Error scraping Myntra price:", error.message);
    return null;
  }
}

async function searchMyntraProduct(
  productName: string
): Promise<Array<{ url: string; price: number }>> {
  try {
    const searchUrl = `https://www.myntra.com/search?q=${encodeURIComponent(productName)}`;
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };

    const { data } = await axios.get(searchUrl, { headers, timeout: 5000 });
    const $ = cheerio.load(data);

    const results: Array<{ url: string; price: number }> = [];

    // Find product links and prices
    $("a[href*='/p/']").slice(0, 3).each((_, element) => {
      const href = $(element).attr("href");
      if (!href) return;

      const productUrl = `https://www.myntra.com${href}`;
      
      // Try to get price from nearby element
      const priceText = $(element)
        .closest("[class*='productContainer']")
        ?.find('[class*="price"]')
        ?.first()
        ?.text() || "";
      
      const priceMatch = priceText.match(/₹[\s]?([0-9,]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
        if (!isNaN(price) && price > 0) {
          results.push({ url: productUrl, price });
        }
      }
    });

    return results;
  } catch (error: any) {
    logError("Error searching Myntra:", error.message);
    return [];
  }
}

export default router;
