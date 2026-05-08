<p align="center">
  <img src="https://img.shields.io/badge/Samsung%20PRISM-Hackathon%202026-0d1120?style=for-the-badge&labelColor=080B14&color=63B3ED" alt="Samsung PRISM 2026"/>
</p>

<h1 align="center">ReceiptVault</h1>

<p align="center">
  <em>An AI-powered receipt intelligence system that lives in your WhatsApp — scanning receipts, tracking return windows, predicting reorders, and watching your spending. Autonomously.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 22"/>
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Gemini-2.5%20Flash-F6AD55?style=flat-square&logo=google&logoColor=white" alt="Gemini 2.5 Flash"/>
  <img src="https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/BullMQ-Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="BullMQ + Redis"/>
  <img src="https://img.shields.io/badge/WhatsApp-Business%20API-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp API"/>
  <img src="https://img.shields.io/badge/Cloudflare-R2-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare R2"/>
  <img src="https://img.shields.io/badge/Expo-React%20Native-000020?style=flat-square&logo=expo&logoColor=white" alt="React Native"/>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Demo Video](#demo-video)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Daily Heartbeat — Autonomous Skills](#daily-heartbeat--autonomous-skills)
- [Ingestion Pipeline](#ingestion-pipeline)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Mobile App (Expo)](#mobile-app-expo)
- [Agent Personality & Guardrails](#agent-personality--guardrails)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [License](#license)

---

## Overview

ReceiptVault turns raw receipt photos — sent over WhatsApp or uploaded through a mobile app — into structured, actionable financial intelligence.

A user photographs a receipt, sends it to the bot, and the system automatically:

1. **Extracts** every line item using **Gemini 2.5 Flash** vision AI
2. **Validates** the extracted data with **Zod v4** schemas
3. **Persists** it to **Supabase (PostgreSQL + pgvector)**
4. **Stores** the original image on **Cloudflare R2**
5. **Schedules** monitoring jobs via **BullMQ** for return deadlines, subscription renewals, and reorder predictions
6. **Fires** proactive WhatsApp alerts when action is needed

A companion **React Native (Expo)** mobile app provides a premium visual dashboard — spending analytics, receipt history, deadline tracking — over the same REST API.

The backend is fully autonomous. Every morning at **8:00–8:25 AM IST**, six cron jobs run sequentially to keep users informed without any manual input.

---

## Demo Video

> 🎥 **Watch the ReceiptVault Demo**

<video src="./demo.mp4" controls="controls" width="100%">
  Your browser does not support the video tag.
</video>

---

## System Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  WhatsApp    │     │   Meta       │     │   Gemini     │     │   BullMQ     │
│  User / App  │────▶│   Webhook    │────▶│   Vision AI  │────▶│   Worker     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                      │
       ┌──────────────────────────────────────────────────────────────┘
       ▼                          ▼                          ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Supabase    │     │  Cloudflare  │     │  WhatsApp    │
│  PostgreSQL  │     │  R2 Storage  │     │  Alert Back  │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Flow:**

1. User sends a receipt photo via **WhatsApp** or the **Expo mobile app**
2. **Meta Webhook** receives the message and downloads the media
3. Image is uploaded to **Cloudflare R2** for permanent storage
4. **Gemini 2.5 Flash** extracts structured data (store, items, amounts, dates)
5. **Zod** validates the extracted JSON against strict schemas
6. Data is inserted into **Supabase PostgreSQL** (receipts + receipt_items)
7. **BullMQ** schedules delayed alert jobs (return reminders, reorder nudges)
8. The **cron scheduler** runs 6 daily skills to proactively notify users

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 22 · Express 5 · TypeScript (strict) | Server & API framework |
| **AI / Vision** | Gemini 2.5 Flash (`@google/generative-ai`) | Receipt OCR & item extraction |
| **Database** | Supabase (PostgreSQL + pgvector) | Structured receipt & user data |
| **Queue** | BullMQ + Redis | Delayed alert jobs & background processing |
| **Object Storage** | Cloudflare R2 (`@aws-sdk/client-s3`) | Receipt image uploads |
| **Notifications** | WhatsApp Business API (Meta Graph) | Inbound webhooks & outbound alerts |
| **Email Sync** | Gmail API via OAuth 2.0 (`googleapis`) | Auto-import online order emails |
| **Validation** | Zod v4 | Runtime schema validation |
| **Price Scraping** | Cheerio + RapidAPI + Axios | Cross-platform price comparison |
| **Mobile App** | React Native (Expo 54) + expo-router | iOS/Android dashboard |
| **Charts** | Victory Native + React Native SVG | Spending analytics visualizations |
| **Auth** | OTP via WhatsApp + Google OAuth 2.0 | Dual authentication flow |

---

## Daily Heartbeat — Autonomous Skills

Every morning, ReceiptVault runs a staggered sequence of autonomous skills. No user action required.

| Time (IST) | Cron | Skill | What It Does |
|---|---|---|---|
| **08:00** | `0 8 * * *` | ⏰ **Deadline Watch** | Queries receipts with return windows or warranties closing in 1, 3, or 7 days. Sends WhatsApp reminders. Respects quiet hours, caps at 3 alerts/hr per user. |
| **08:05** | `5 8 * * *` | 🛒 **Consumable Tracker** | Computes average reorder intervals from purchase history. Fires a WhatsApp nudge with an Amazon India link when stock is predicted to be low. |
| **08:10** | `10 8 * * *` | 🔄 **Subscription Manager** | Finds active subscriptions renewing within 7 days. Sends KEEP / CANCEL prompts. Never auto-cancels — records intent only. |
| **08:15** | `15 8 * * 1` | 📊 **Spending Dashboard** | Every Monday: total spend + per-store breakdown + biggest purchase. Clean summary, no fluff. |
| **08:20** | `20 8 * * *` | 📧 **Gmail Sync** | Scans Gmail for order confirmations from Amazon, Flipkart, Zomato, Swiggy & BigBasket. Auto-creates receipts — zero user effort. |
| **08:25** | `25 8 * * *` | 💰 **Price Monitor** | Tracks price changes for previously purchased items across platforms. Alerts on significant drops. |

---

## Ingestion Pipeline

The core processing pipeline (`src/utils/pipeline.ts`) handles receipts from both WhatsApp and the REST API:

```
Receipt Image (Buffer)
        │
        ▼
┌─ uploadToR2() ──────────▶ Cloudflare R2 (permanent storage)
│
├─ extractReceiptData() ──▶ Gemini 2.5 Flash (structured JSON extraction)
│
├─ validateReceiptData() ─▶ Zod v4 (schema validation & defaults)
│
├─ insertReceipt() ───────▶ Supabase (receipts + receipt_items tables)
│
├─ appendReceiptToIndex() ▶ Local memory index (for agent context)
│
└─ scheduleAlerts() ──────▶ BullMQ (delayed return/warranty reminders)
```

**Duplicate detection** is built-in — the system won't store the same receipt twice.

---

## API Reference

All authenticated endpoints require the `X-User-Phone` header (e.g., `+919876543210`).

### Authentication (Public)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Send OTP to WhatsApp |
| `POST` | `/api/auth/verify-otp` | Verify OTP, returns user (creates if new) |
| `POST` | `/api/auth/registration-status` | Check if email/phone is already registered |
| `POST` | `/api/auth/register-oauth` | Link Google account to phone number |
| `POST` | `/api/auth/google-consent` | Store Gmail refresh token after OAuth consent |
| `GET` | `/api/auth/oauth-config` | Returns available OAuth providers |
| `GET` | `/api/auth/google-url` | Generate Google OAuth consent URL |

### Receipts (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload-receipt` | Upload receipt image (multipart, max 10MB) — runs full AI pipeline |
| `GET` | `/api/receipts` | List all receipts (supports `?category=`, `?search=`, `?limit=`) |
| `GET` | `/api/receipts/:id` | Get single receipt with items |
| `DELETE` | `/api/receipts/:id` | Delete a specific receipt |
| `DELETE` | `/api/receipts` | Delete all receipts for user |
| `GET` | `/api/export` | Export all receipts as JSON |

### Analytics (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/spending` | Spending over time (`?period=week\|month\|year`) |
| `GET` | `/api/analytics/categories` | Spending breakdown by category |
| `GET` | `/api/analytics/top-merchants` | Top 5 merchants by spend |
| `GET` | `/api/analytics/price-monitor` | Price change tracker for purchased items |
| `GET` | `/api/dashboard/stats` | Dashboard summary (total receipts, expiring returns, monthly spend) |

### Price Comparison (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/price-history` | Query price history (`?platform=`, `?product=`) |
| `POST` | `/api/price-history/record` | Manually record a market price |
| `GET` | `/api/price-comparison/:productId` | Compare prices across time and platforms |
| `POST` | `/api/fetch-current-price` | Fetch current price from Myntra via RapidAPI |

### Gmail (Authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trigger-gmail-scan` | Manually trigger Gmail scan for the user |

### Webhook

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/webhook/whatsapp` | Meta webhook verification (hub.verify_token challenge) |
| `POST` | `/webhook/whatsapp` | Incoming WhatsApp messages (receipt images, CANCEL commands) |

---

## Database Schema

Six core tables in Supabase PostgreSQL:

### `receipts`
| Column | Type | Description |
|---|---|---|
| `id` | `UUID` (PK) | Auto-generated |
| `user_phone` | `TEXT` | User's phone number (+91...) |
| `store_name` | `TEXT` | Extracted store name |
| `purchase_date` | `DATE` | Purchase date (nullable) |
| `total_amount` | `NUMERIC(12,2)` | Total receipt amount |
| `currency` | `CHAR(3)` | ISO currency code (default: INR) |
| `r2_image_url` | `TEXT` | Cloudflare R2 image URL |
| `return_deadline_date` | `DATE` | Computed return deadline |
| `warranty_expiry_date` | `DATE` | Computed warranty expiry |
| `receipt_number` | `TEXT` | Extracted receipt number |
| `date_inferred` | `BOOLEAN` | Whether date was AI-inferred |
| `created_at` | `TIMESTAMPTZ` | Row creation timestamp |

### `receipt_items`
| Column | Type | Description |
|---|---|---|
| `id` | `UUID` (PK) | Auto-generated |
| `receipt_id` | `UUID` (FK) | References `receipts.id` |
| `name` | `TEXT` | Item name |
| `quantity` | `NUMERIC(10,3)` | Quantity purchased |
| `unit_price` | `NUMERIC(12,2)` | Price per unit |
| `total_price` | `NUMERIC(12,2)` | Line item total |
| `is_consumable` | `BOOLEAN` | Flags reorderable consumables |

### `subscriptions`
| Column | Type | Description |
|---|---|---|
| `id` | `UUID` (PK) | Auto-generated |
| `user_phone` | `TEXT` | User's phone number |
| `service_name` | `TEXT` | Subscription service name |
| `renewal_amount` | `NUMERIC(12,2)` | Renewal cost |
| `renewal_date` | `DATE` | Next renewal date |
| `cancellation_url` | `TEXT` | Direct cancellation link |
| `status` | `TEXT` | `active` \| `cancelled` \| `paused` |

### `gmail_accounts`
| Column | Type | Description |
|---|---|---|
| `id` | `UUID` (PK) | Auto-generated |
| `user_id` | `UUID` (FK) | References `users.id` |
| `email` | `TEXT` | Gmail address |
| `google_refresh_token` | `TEXT` | OAuth refresh token |
| `status` | `TEXT` | `pending` \| `active` |

---

## Mobile App (Expo)

The companion mobile app is built with **React Native (Expo 54)** and lives in the `frontend/` directory.

### Screens

| Tab | File | Description |
|---|---|---|
| 🏠 **Home** | `app/(tabs)/index.tsx` | Dashboard with spending stats, recent receipts, quick actions |
| 🧾 **Receipts** | `app/(tabs)/receipts.tsx` | Full receipt history with search and category filters |
| 📊 **Spending** | `app/(tabs)/spending.tsx` | Spending analytics with charts (Victory Native) |
| ⏰ **Deadlines** | `app/(tabs)/deadlines.tsx` | Return deadlines and warranty expiry tracker |
| ⚙️ **Settings** | `app/(tabs)/settings.tsx` | Account settings, Gmail linking, preferences |

### Additional Screens

| Screen | File | Description |
|---|---|---|
| 🔐 **Login** | `app/login.tsx` | OTP + Google OAuth dual authentication |
| 📸 **Upload** | `app/upload.tsx` | Camera/gallery receipt upload with AI processing |
| 📄 **Receipt Detail** | `app/receipt/` | Full receipt detail view with items |

### Key Dependencies

- `expo-router` — File-based routing
- `victory-native` — Charting library
- `expo-image-picker` — Camera/gallery access
- `expo-haptics` — Haptic feedback
- `moti` + `react-native-reanimated` — Animations
- `@react-native-async-storage/async-storage` — Local persistence
- `expo-auth-session` + `expo-web-browser` — Google OAuth flow

---

## Agent Personality & Guardrails

ReceiptVault is governed by a strict set of behavioral rules defined in [`SOUL.md`](SOUL.md):

### What It Does
- Scans and stores receipts with full item-level detail
- Tracks return deadlines and warranty periods with proactive reminders
- Detects subscription renewals and helps users decide to KEEP or CANCEL
- Predicts consumable reorder timing and suggests purchases with direct links
- Sends weekly spending summaries every Monday
- Auto-syncs online orders from Gmail

### What It Never Does
- ❌ **Never places orders** — suggests and links, but you always click "buy"
- ❌ **Never cancels subscriptions** — records intent and provides the URL; you do the rest
- ❌ **Never sends more than 3 alerts per hour per user** — respects your attention
- ❌ **Never sends messages longer than 300 characters** (except weekly summaries)
- ❌ **Never acts without confirmation** on destructive or irreversible actions

### Confirmation Rules
For any destructive action, ReceiptVault always prompts with a yes/no confirmation first. If the user doesn't respond, silence means "no."

### Tone Examples

> **Return deadline reminder:**
> Return window for your Croma purchase closes in 3 days — 2026-05-10. Act now if you want to return it.

> **Consumable reorder nudge:**
> Running low on oat milk? Your usual reorder is due around May 7. Order here: https://www.amazon.in/s?k=oat+milk

> **Subscription renewal prompt:**
> Spotify renews on May 12 for INR 119. Reply KEEP to continue or CANCEL to record cancellation intent.

---

## Getting Started

### Prerequisites

- **Node.js** >= 18 (`.nvmrc` pins to 22)
- **Redis** (BullMQ queue backend)
- **Docker** (optional — `docker-compose.yml` included for Redis)

### 1. Clone & Install

```bash
git clone https://github.com/Lishhhh07/Receiptvaultfinal.git
cd Receiptvaultfinal
npm install
```

### 2. Start Redis

```bash
# Option A: Docker (recommended)
docker compose up -d

# Option B: Local Redis
redis-server
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual keys (see Environment Variables below)
```

### 4. Initialize Database

Run [`SCHEMA.sql`](SCHEMA.sql) in your Supabase SQL Editor. This creates all required tables: `receipts`, `receipt_items`, `subscriptions`, `gmail_accounts`, `users`, and `otp_codes`.

### 5. Start the Server

```bash
npm run dev
```

The server starts on `http://localhost:3000`. It will automatically:
- Start the BullMQ worker for background job processing
- Register all 6 autonomous cron jobs
- Run an initial Gmail sync scan
- Log the webhook callback URL (if `WEBHOOK_PUBLIC_URL` is set)

### 6. Expose Webhook (for WhatsApp)

To receive WhatsApp messages, you need a public URL. See [`WEBHOOK_SETUP.md`](WEBHOOK_SETUP.md) for full instructions.

```bash
# Using ngrok
ngrok http 3000

# Using cloudflared
cloudflared tunnel --url http://localhost:3000
```

Set the tunnel URL in `.env` as `WEBHOOK_PUBLIC_URL` and configure it in the Meta WhatsApp webhook settings.

### 7. Start the Mobile App (Optional)

```bash
cd frontend
npm install
npx expo start
```

---

## Environment Variables

Create a `.env` file from `.env.example`. All variables are documented below:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3000`) |
| `WEBHOOK_PUBLIC_URL` | No | Public tunnel URL for Meta webhook callbacks |
| `META_VERIFY_TOKEN` | Yes | WhatsApp webhook verification token |
| `META_ACCESS_TOKEN` | Yes | Meta WhatsApp Business API access token |
| `META_PHONE_NUMBER_ID` | Yes | Meta WhatsApp phone number ID |
| `GEMINI_API_KEY` | Yes | Google Gemini API key ([ai.google.dev](https://ai.google.dev)) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | Yes | R2 bucket name |
| `R2_PUBLIC_URL` | Yes | R2 public bucket URL |
| `REDIS_URL` | Yes | Redis connection string (default: `redis://localhost:6379`) |
| `ADMIN_PHONE` | No | Admin phone for test alerts |
| `TEST_PHONE` | No | Test phone for dev smoke tests |
| `GOOGLE_CSE_KEY` | No | Google Custom Search key (price monitoring) |
| `GOOGLE_CSE_ID` | No | Google Custom Search engine ID |
| `GOOGLE_OAUTH_CLIENT_ID` | No | Google OAuth client ID (Gmail + auth) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | No | Google OAuth redirect URI |
| `RAPID_API_KEY` | No | RapidAPI key (price comparison) |
| `RAPID_API_HOST` | No | RapidAPI host |

---

## Project Structure

```
ReceiptVaultFinal/
├── src/
│   ├── index.ts                    # Express server entry point
│   ├── scheduler.ts                # Cron job registration (6 daily skills)
│   ├── routes/
│   │   ├── api.ts                  # REST API endpoints (auth, receipts, analytics)
│   │   └── webhook.ts              # WhatsApp webhook handler
│   ├── services/
│   │   ├── geminiVision.ts         # Gemini 2.5 Flash receipt extraction
│   │   ├── gmailScanner.ts         # Gmail API order email scanner
│   │   ├── mediaDownloader.ts      # WhatsApp media download via Meta API
│   │   ├── notificationSender.ts   # WhatsApp message sender
│   │   ├── otpService.ts           # OTP generation & verification
│   │   ├── r2Uploader.ts           # Cloudflare R2 image upload
│   │   └── supabaseWriter.ts       # Supabase database operations
│   ├── skills/
│   │   ├── deadline-watch/         # Return & warranty deadline alerts
│   │   ├── consumable-tracker/     # Reorder prediction & nudges
│   │   ├── sub-manager/            # Subscription renewal management
│   │   ├── spending-dashboard/     # Weekly spending summary
│   │   └── price-monitor/          # Cross-platform price tracking
│   ├── queue/
│   │   ├── producer.ts             # BullMQ job scheduling
│   │   └── worker.ts               # BullMQ job processing
│   ├── utils/
│   │   ├── pipeline.ts             # Core receipt processing pipeline
│   │   ├── alertHelpers.ts         # Alert rate-limiting & formatting
│   │   ├── memory.ts               # YAML-based user preference storage
│   │   └── logger.ts               # Logging utility
│   └── validators/
│       └── receiptSchema.ts        # Zod v4 receipt validation schemas
├── frontend/                       # React Native (Expo 54) mobile app
│   ├── app/
│   │   ├── (tabs)/                 # Tab-based navigation screens
│   │   ├── auth/                   # Authentication screens
│   │   ├── receipt/                # Receipt detail screens
│   │   ├── login.tsx               # Login screen (OTP + OAuth)
│   │   └── upload.tsx              # Receipt upload screen
│   ├── context/
│   │   └── AuthContext.tsx          # Authentication state management
│   └── lib/                        # Shared utilities
├── memory/                         # Per-user YAML preferences & patterns
├── SCHEMA.sql                      # PostgreSQL database schema
├── SOUL.md                         # Agent personality & behavioral rules
├── HEARTBEAT.md                    # Daily automation documentation
├── WEBHOOK_SETUP.md                # WhatsApp webhook tunnel guide
├── docker-compose.yml              # Redis container
├── .env.example                    # Environment variable template
└── tsconfig.json                   # TypeScript configuration (strict)
```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| **Dev Server** | `npm run dev` | Start with nodemon + ts-node (auto-reload) |
| **Production** | `npm start` | Run compiled `dist/index.js` |
| **Build** | `npm run build` | Compile TypeScript to `dist/` |
| **Scheduler** | `npm run scheduler` | Run scheduler as standalone process |
| **Lint** | `npm run lint` | Run ESLint on all `.ts` files |
| **Gmail Token** | `npm run get-gmail-token` | Generate Gmail OAuth refresh token |

---

## License

ISC

---

<p align="center">
  <sub>Built with ☕ for Samsung PRISM Hackathon 2026</sub>
</p>
