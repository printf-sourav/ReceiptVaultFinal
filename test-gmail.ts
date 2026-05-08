import "dotenv/config";
import { scanGmail } from "./src/services/gmailScanner";
import { log } from "./src/utils/logger";

async function main() {
  log("Starting manual Gmail scan test...");
  await scanGmail();
  log("Manual Gmail scan test completed.");
}

main().catch(console.error);
