import { GoogleGenerativeAI } from "@google/generative-ai";
import { log, logError } from "../utils/logger";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const EXTRACTION_PROMPT = `You are a receipt data extractor. Analyze the receipt image and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

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

export async function extractReceiptData(imageBuffer: Buffer): Promise<unknown> {
  const base64String = imageBuffer.toString("base64");

  try {
    const result = await model.generateContent([
      { text: EXTRACTION_PROMPT },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64String,
        },
      },
    ]);

    const responseText = result.response.text();
    log(`Gemini response length: ${responseText.length} chars`);

    try {
      return JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      logError("Failed to parse Gemini response as JSON");
      return { store_name: "Unknown", parse_error: true, total_amount: 0 };
    }
  } catch (error) {
    logError("Gemini extraction failed", error);
    return { store_name: "Unknown", parse_error: true, total_amount: 0 };
  }
}
