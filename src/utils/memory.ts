import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "js-yaml";
import { log } from "./logger";

const MEMORY_DIR = path.resolve(__dirname, "../../memory");

export interface UserPrefs {
  quiet_hours_start: string;
  quiet_hours_end: string;
  preferred_platform: string;
  max_alerts_per_hour: number;
  auto_actions_approved: string[];
}

export interface ReorderInterval {
  item_name: string;
  avg_days: number;
  last_purchased: string;
}

export interface UserPatterns {
  reorder_intervals: ReorderInterval[];
  preferred_stores: {
    groceries: string;
    electronics: string;
  };
}

const DEFAULT_PREFS: UserPrefs = {
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
  preferred_platform: "whatsapp",
  max_alerts_per_hour: 3,
  auto_actions_approved: [],
};

const DEFAULT_PATTERNS: UserPatterns = {
  reorder_intervals: [],
  preferred_stores: {
    groceries: "",
    electronics: "",
  },
};

const INDEX_HEADER = `## Receipt Log
| Date | Store | Amount | Currency | Receipt ID |
|------|-------|--------|----------|------------|
`;

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function getUserPrefs(userPhone: string): Promise<UserPrefs> {
  const filePath = path.join(MEMORY_DIR, userPhone, "prefs.yaml");

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return yaml.load(content) as UserPrefs;
  } catch {
    await ensureDir(path.join(MEMORY_DIR, userPhone));
    await fs.writeFile(filePath, yaml.dump(DEFAULT_PREFS), "utf-8");
    log(`Created default prefs for ${userPhone}`);
    return { ...DEFAULT_PREFS };
  }
}

export async function saveUserPrefs(userPhone: string, prefs: Partial<UserPrefs>): Promise<void> {
  const existing = await getUserPrefs(userPhone);
  const merged = { ...existing, ...prefs };
  const filePath = path.join(MEMORY_DIR, userPhone, "prefs.yaml");
  await ensureDir(path.join(MEMORY_DIR, userPhone));
  await fs.writeFile(filePath, yaml.dump(merged), "utf-8");
}

export async function getUserPatterns(userPhone: string): Promise<UserPatterns> {
  const filePath = path.join(MEMORY_DIR, userPhone, "patterns.yaml");

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return yaml.load(content) as UserPatterns;
  } catch {
    await ensureDir(path.join(MEMORY_DIR, userPhone));
    await fs.writeFile(filePath, yaml.dump(DEFAULT_PATTERNS), "utf-8");
    log(`Created default patterns for ${userPhone}`);
    return { ...DEFAULT_PATTERNS };
  }
}

export async function saveUserPatterns(userPhone: string, patterns: Partial<UserPatterns>): Promise<void> {
  const existing = await getUserPatterns(userPhone);
  const merged = { ...existing, ...patterns };
  const filePath = path.join(MEMORY_DIR, userPhone, "patterns.yaml");
  await ensureDir(path.join(MEMORY_DIR, userPhone));
  await fs.writeFile(filePath, yaml.dump(merged), "utf-8");
}

export async function appendReceiptToIndex(receipt: {
  date: string;
  store: string;
  amount: number;
  currency: string;
  id: string;
}): Promise<void> {
  const indexPath = path.join(MEMORY_DIR, "receipts", "index.md");

  try {
    await fs.access(indexPath);
  } catch {
    await ensureDir(path.join(MEMORY_DIR, "receipts"));
    await fs.writeFile(indexPath, INDEX_HEADER, "utf-8");
  }

  const row = `| ${receipt.date} | ${receipt.store} | ${receipt.amount} | ${receipt.currency} | ${receipt.id} |\n`;
  await fs.appendFile(indexPath, row, "utf-8");
  log(`Appended receipt ${receipt.id} to index`);
}
