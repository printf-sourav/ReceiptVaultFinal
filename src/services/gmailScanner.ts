import { google } from "googleapis";
import * as fs from "fs/promises";
import * as path from "path";
import * as readline from "readline";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateReceiptData } from "../validators/receiptSchema";
import { insertReceipt, supabase } from "./supabaseWriter";
import { appendReceiptToIndex } from "../utils/memory";
import { log, logError } from "../utils/logger";

const CREDENTIALS_PATH = path.resolve(__dirname, "../../credentials.json");
const TOKEN_PATH = path.resolve(__dirname, "../../token.json");
const PROCESSED_PATH = path.resolve(__dirname, "../../.gmail-processed.json");
const ADMIN_PHONE = process.env.ADMIN_PHONE || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const KNOWN_SENDERS = [
  "order-update@amazon.in",
  "no-reply@flipkart.com",
  "no-reply@zomato.com",
  "orders@swiggy.in",
  "noreply@bigbasket.com",
  "meritnook@gmail.com", // Test sender
];

const RECEIPT_SUBJECT_KEYWORDS = [
  "order confirmation",
  "order",
  "invoice",
  "receipt",
  "your order",
  "order placed",
  "payment confirmation",
];

const EXTRACTION_PROMPT = `You are a receipt data extractor. Analyze the email content and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

Required fields:
{
  "store_name": "string",
  "purchase_date": "YYYY-MM-DD or null if not visible",
  "total_amount": "number",
  "currency": "3-letter ISO code e.g. INR",
  "items": [
    {
      "name": "string",
      "quantity": "number",
      "unit_price": "number",
      "total_price": "number",
      "is_consumable": "boolean — true for food, toiletries, household supplies"
    }
  ],
  "return_deadline_days": "number or null",
  "warranty_months": "number or null",
  "receipt_number": "string or null"
}`;

async function getProcessedIds(): Promise<Set<string>> {
  try {
    const content = await fs.readFile(PROCESSED_PATH, "utf-8");
    return new Set(JSON.parse(content));
  } catch {
    return new Set();
  }
}

async function saveProcessedIds(ids: Set<string>): Promise<void> {
  await fs.writeFile(PROCESSED_PATH, JSON.stringify([...ids], null, 2), "utf-8");
}

async function authorize(): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const credContent = await fs.readFile(CREDENTIALS_PATH, "utf-8");
  const credentials = JSON.parse(credContent);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await fs.readFile(TOKEN_PATH, "utf-8");
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch {
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES });
    console.log("Authorize this app by visiting this URL:", authUrl);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const code = await new Promise<string>((resolve) => {
      rl.question("Enter the code from that page here: ", (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), "utf-8");
    log("Gmail token saved to token.json");
    return oAuth2Client;
  }
}

async function authorizeWithRefreshToken(refreshToken: string): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const credContent = await fs.readFile(CREDENTIALS_PATH, "utf-8");
  const credentials = JSON.parse(credContent);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractTextFromPayload(payload: any): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      const nested = extractTextFromPayload(part);
      if (nested) return nested;
    }
  }

  return "";
}

export async function scanGmail(): Promise<void> {
  try {
    await fs.access(CREDENTIALS_PATH);
  } catch {
    log("Gmail scanner skipped: credentials.json not found. Place your OAuth credentials file at project root.");
    return;
  }

  try {
    const auth = await authorize();
    const gmail = google.gmail({ version: "v1", auth });

    const senderQuery = KNOWN_SENDERS.map((s) => s.split("@")[1]).join(" OR ");
    const subjectQuery = RECEIPT_SUBJECT_KEYWORDS.join(" OR ");
    const query = `from:(${senderQuery}) subject:(${subjectQuery}) newer_than:1d`;

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 20,
    });

    const messages = listResponse.data.messages || [];
    if (messages.length === 0) {
      log("Gmail scan: no new receipt emails found");
      return;
    }

    const processedIds = await getProcessedIds();
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    for (const msg of messages) {
      if (!msg.id || processedIds.has(msg.id)) continue;

      const fullMsg = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const emailBody = extractTextFromPayload(fullMsg.data.payload);
      if (!emailBody) {
        log(`Gmail: empty body for message ${msg.id}, skipping`);
        continue;
      }

      try {
        const result = await model.generateContent([
          { text: EXTRACTION_PROMPT + "\n\nEmail content:\n" + emailBody },
        ]);

        const responseText = result.response.text();
        let parsed: unknown;

        try {
          parsed = JSON.parse(responseText);
        } catch {
          const match = responseText.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            parsed = { store_name: "Unknown", parse_error: true, total_amount: 0 };
          }
        }

        const validatedData = validateReceiptData(parsed);
        await insertReceipt(validatedData, "", ADMIN_PHONE);

        await appendReceiptToIndex({
          date: validatedData.purchase_date || new Date().toISOString().split("T")[0],
          store: validatedData.store_name,
          amount: validatedData.total_amount,
          currency: validatedData.currency,
          id: msg.id,
        });

        processedIds.add(msg.id);
        log(`Gmail receipt processed: ${validatedData.store_name} ${validatedData.total_amount} from email ${msg.id}`);
      } catch (extractError) {
        logError(`Failed to process Gmail message ${msg.id}`, extractError);
      }
    }

    await saveProcessedIds(processedIds);
  } catch (error) {
    logError("Gmail scan failed", error);
  }
}

export async function scanUserGmail(userPhone: string, refreshToken: string): Promise<void> {
  try {
    const auth = await authorizeWithRefreshToken(refreshToken);
    const gmail = google.gmail({ version: "v1", auth });

    // Gmail search can be finicky with complex grouped queries.
    // Use multiple simple queries and merge unique message IDs.
    const queries = [
      ...RECEIPT_SUBJECT_KEYWORDS.map((keyword) => `subject:${JSON.stringify(keyword)} newer_than:3d`),
      `"order" newer_than:3d`,
      ...KNOWN_SENDERS.map((sender) => `from:${sender} newer_than:3d`),
    ];

    const messageMap = new Map<string, any>();
    for (const query of queries) {
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 10,
      });
      const queryMessages = listResponse.data.messages || [];
      log(`📧 Gmail scan query: ${query} -> ${queryMessages.length} matches`);
      for (const msg of queryMessages) {
        if (msg.id) messageMap.set(msg.id, msg);
      }
    }

    const messages = Array.from(messageMap.values()).slice(0, 20);
    log(`📊 Gmail scan: found ${messages.length} emails for ${userPhone}`);
    
    if (messages.length === 0) {
      log(`Gmail scan: no new receipt emails found for ${userPhone}`);
      return;
    }

    const processedIds = await getProcessedIds();
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    for (const msg of messages) {
      if (!msg.id || processedIds.has(msg.id)) continue;

      const fullMsg = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const emailBody = extractTextFromPayload(fullMsg.data.payload);
      if (!emailBody) continue;

      try {
        const result = await model.generateContent([
          { text: EXTRACTION_PROMPT + "\n\nEmail content:\n" + emailBody },
        ]);

        const responseText = result.response.text();
        let parsed: unknown;

        try {
          parsed = JSON.parse(responseText);
        } catch {
          const match = responseText.match(/\{[\s\S]*\}/);
          parsed = match ? JSON.parse(match[0]) : { store_name: "Unknown", parse_error: true, total_amount: 0 };
        }

        const validatedData = validateReceiptData(parsed);
        await insertReceipt(validatedData, "", userPhone, { source: "gmail", geminiRaw: parsed });

        await appendReceiptToIndex({
          date: validatedData.purchase_date || new Date().toISOString().split("T")[0],
          store: validatedData.store_name,
          amount: validatedData.total_amount,
          currency: validatedData.currency,
          id: msg.id,
        });

        processedIds.add(msg.id);
        log(`✅ Gmail receipt processed: ${validatedData.store_name} ${validatedData.total_amount} from email ${msg.id}`);
      } catch (extractError) {
        logError(`Failed to process Gmail message ${msg.id}`, extractError);
      }
    }

    await saveProcessedIds(processedIds);
  } catch (error) {
    logError(`Gmail scan failed for ${userPhone}`, error);
  }
}

export async function scanAllLinkedGmailAccounts(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("gmail_accounts")
      .select("user_id, email, google_refresh_token, status")
      .eq("status", "active")
      .not("google_refresh_token", "is", null);

    if (error) {
      if ((error as any).code === "PGRST205") {
        log("Gmail scan skipped: gmail_accounts table is not initialized yet.");
        return;
      }
      logError("Failed to load linked Gmail accounts", error);
      return;
    }

    for (const account of data || []) {
      const refreshToken = (account as any).google_refresh_token as string | null;
      const userId = (account as any).user_id as string | null;

      if (!userId || !refreshToken) continue;

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("phone")
        .eq("id", userId)
        .single();

      if (userError || !user?.phone) continue;

      await scanUserGmail(user.phone, refreshToken);
    }
  } catch (error) {
    logError("Linked Gmail batch scan failed", error);
  }
}
