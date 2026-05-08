import axios from "axios";
import { log, logError } from "../utils/logger";

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;

export async function getMediaUrl(mediaId: string): Promise<string> {
  const response = await axios.get(
    `https://graph.facebook.com/v19.0/${mediaId}`,
    { headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` } }
  );

  if (!response.data?.url) {
    throw new Error(`Failed to get media URL for mediaId: ${mediaId}`);
  }

  return response.data.url;
}

export async function downloadMedia(mediaId: string): Promise<Buffer> {
  const url = await getMediaUrl(mediaId);

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` },
    });

    const buffer = Buffer.from(response.data);
    log(`Downloaded image: ${buffer.length} bytes`);
    return buffer;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 410) {
      throw new Error("Media URL expired. Please resend the image.");
    }
    logError("Failed to download media", error);
    throw error;
  }
}
