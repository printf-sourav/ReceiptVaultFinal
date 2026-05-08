import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { log, logError } from "../utils/logger";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const s3Client = new S3Client({
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: "auto",
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateFileName(senderPhone: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `receipts/${senderPhone}/${Date.now()}-${random}.jpg`;
}

export async function uploadToR2(imageBuffer: Buffer, senderPhone: string): Promise<string> {
  const filename = generateFileName(senderPhone);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: filename,
    Body: imageBuffer,
    ContentType: "image/jpeg",
  });

  try {
    await s3Client.send(command);
  } catch (firstError) {
    logError("R2 upload failed, retrying in 2s...", firstError);
    await sleep(2000);

    try {
      await s3Client.send(command);
    } catch (retryError) {
      logError("R2 upload retry failed", retryError);
      throw firstError;
    }
  }

  const publicUrl = `${R2_PUBLIC_URL}/${filename}`;
  log(`Uploaded to R2: ${imageBuffer.length} bytes → ${publicUrl}`);
  return publicUrl;
}
